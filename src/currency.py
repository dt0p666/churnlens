"""
ChurnLens Currency Conversion & Locale Formatting Engine.
Dataset records MonthlyCharges and TotalCharges in US Dollars (USD).
Provides static reference rates for honest, transparent currency display across INR (₹), EUR (€), GBP (£), etc.
"""

from typing import Dict, Any, Optional

# Reference exchange rates per 1.0 USD (as of reference date)
REFERENCE_RATES_DATE = "2026-10-01"

SUPPORTED_CURRENCIES: Dict[str, Dict[str, Any]] = {
    "INR": {
        "name": "Indian Rupee",
        "symbol": "₹",
        "rate": 84.00,       # 1 USD = 84.00 INR
        "locale": "en-IN",
        "digits": 2,
    },
    "USD": {
        "name": "US Dollar",
        "symbol": "$",
        "rate": 1.00,        # Base currency
        "locale": "en-US",
        "digits": 2,
    },
    "EUR": {
        "name": "Euro",
        "symbol": "€",
        "rate": 0.92,        # 1 USD = 0.92 EUR
        "locale": "de-DE",
        "digits": 2,
    },
    "GBP": {
        "name": "British Pound",
        "symbol": "£",
        "rate": 0.78,        # 1 USD = 0.78 GBP
        "locale": "en-GB",
        "digits": 2,
    },
    "JPY": {
        "name": "Japanese Yen",
        "symbol": "¥",
        "rate": 152.00,      # 1 USD = 152.00 JPY
        "locale": "ja-JP",
        "digits": 0,
    },
    "AED": {
        "name": "UAE Dirham",
        "symbol": "AED",
        "rate": 3.6725,     # 1 USD = 3.6725 AED
        "locale": "ar-AE",
        "digits": 2,
    },
    "AUD": {
        "name": "Australian Dollar",
        "symbol": "A$",
        "rate": 1.52,        # 1 USD = 1.52 AUD
        "locale": "en-AU",
        "digits": 2,
    },
    "CAD": {
        "name": "Canadian Dollar",
        "symbol": "C$",
        "rate": 1.38,        # 1 USD = 1.38 CAD
        "locale": "en-CA",
        "digits": 2,
    },
    "SGD": {
        "name": "Singapore Dollar",
        "symbol": "S$",
        "rate": 1.32,        # 1 USD = 1.32 SGD
        "locale": "en-SG",
        "digits": 2,
    },
}

def convert_from_usd(amount_usd: float, target_currency: str = "INR") -> float:
    """
    Converts a base USD amount to target currency using reference rate.
    """
    curr = target_currency.upper()
    rate = SUPPORTED_CURRENCIES.get(curr, SUPPORTED_CURRENCIES["USD"])["rate"]
    return round(float(amount_usd) * rate, 2)

def convert_to_usd(amount_local: float, source_currency: str = "INR") -> float:
    """
    Converts a local currency amount back to USD before feeding into the ML model pipeline.
    Ensures model always sees USD figures as trained.
    """
    curr = source_currency.upper()
    rate = SUPPORTED_CURRENCIES.get(curr, SUPPORTED_CURRENCIES["USD"])["rate"]
    if rate <= 0:
        return float(amount_local)
    return round(float(amount_local) / rate, 2)

def format_currency(amount_usd: float, target_currency: str = "INR") -> str:
    """
    Formats a base USD amount into the target currency string with symbol.
    """
    curr = target_currency.upper()
    cfg = SUPPORTED_CURRENCIES.get(curr, SUPPORTED_CURRENCIES["USD"])
    converted = round(float(amount_usd) * cfg["rate"], cfg["digits"])
    symbol = cfg["symbol"]
    if cfg["digits"] == 0:
        return f"{symbol}{int(converted):,}"
    return f"{symbol}{converted:,.2f}"

def get_currency_config() -> Dict[str, Any]:
    """
    Returns reference rate table, default currency, and reference metadata.
    """
    return {
        "base_currency": "USD",
        "default_currency": "INR",
        "reference_date": REFERENCE_RATES_DATE,
        "disclosure": f"Dataset charges are recorded in USD. Displayed values are converted at reference rates as of {REFERENCE_RATES_DATE}.",
        "currencies": SUPPORTED_CURRENCIES,
    }
