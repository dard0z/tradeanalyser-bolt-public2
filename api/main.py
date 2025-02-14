from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BacktestRequest(BaseModel):
    prices: List[float]
    entry_price: float
    take_profit: float
    stop_loss: float
    direction: str

class Trade:
    def __init__(self, entry_price: float, take_profit: float, stop_loss: float, direction: str):
        self.entry_price = entry_price
        self.take_profit = take_profit
        self.stop_loss = stop_loss
        self.direction = direction
        self.entry_time = None
        self.exit_time = None
        self.exit_price = None
        self.result = None
        self.profit_loss = 0

def calculate_profit_loss(entry_price: float, exit_price: float, direction: str) -> float:
    if direction == "long":
        return (exit_price - entry_price) / entry_price * 100
    else:
        return (entry_price - exit_price) / entry_price * 100

@app.get("/")
async def root():
    return {"status": "ok"}

@app.post("/backtest")
async def backtest(request: BacktestRequest):
    if len(request.prices) < 2:
        raise HTTPException(status_code=400, detail="Not enough price data")

    trades = []
    current_trade = None
    
    for i, price in enumerate(request.prices):
        if current_trade is None and i < len(request.prices) - 1:
            current_trade = Trade(
                request.entry_price,
                request.take_profit,
                request.stop_loss,
                request.direction
            )
            current_trade.entry_time = i
            continue

        if current_trade is not None:
            exit_triggered = False
            if request.direction == "long":
                if price >= request.take_profit:
                    current_trade.exit_price = request.take_profit
                    current_trade.result = "take_profit"
                    exit_triggered = True
                elif price <= request.stop_loss:
                    current_trade.exit_price = request.stop_loss
                    current_trade.result = "stop_loss"
                    exit_triggered = True
            else:
                if price <= request.take_profit:
                    current_trade.exit_price = request.take_profit
                    current_trade.result = "take_profit"
                    exit_triggered = True
                elif price >= request.stop_loss:
                    current_trade.exit_price = request.stop_loss
                    current_trade.result = "stop_loss"
                    exit_triggered = True

            if exit_triggered:
                current_trade.exit_time = i
                current_trade.profit_loss = calculate_profit_loss(
                    current_trade.entry_price,
                    current_trade.exit_price,
                    current_trade.direction
                )
                trades.append({
                    "entry_time": current_trade.entry_time,
                    "exit_time": current_trade.exit_time,
                    "entry_price": current_trade.entry_price,
                    "exit_price": current_trade.exit_price,
                    "result": current_trade.result,
                    "profit_loss": current_trade.profit_loss
                })
                current_trade = None

    if not trades:
        return {
            "success": False,
            "message": "No trades were completed in the backtest period",
            "trades": [],
            "statistics": None
        }

    profit_losses = [trade["profit_loss"] for trade in trades]
    winning_trades = [pl for pl in profit_losses if pl > 0]
    losing_trades = [pl for pl in profit_losses if pl <= 0]

    statistics = {
        "total_trades": len(trades),
        "winning_trades": len(winning_trades),
        "losing_trades": len(losing_trades),
        "win_rate": len(winning_trades) / len(trades) * 100 if trades else 0,
        "average_profit": float(np.mean(profit_losses)) if profit_losses else 0,
        "max_profit": max(profit_losses) if profit_losses else 0,
        "max_loss": min(profit_losses) if profit_losses else 0,
        "profit_factor": abs(sum(winning_trades) / sum(losing_trades)) if losing_trades else float('inf'),
        "average_win": float(np.mean(winning_trades)) if winning_trades else 0,
        "average_loss": float(np.mean(losing_trades)) if losing_trades else 0,
    }

    return {
        "success": True,
        "trades": trades,
        "statistics": statistics
    }