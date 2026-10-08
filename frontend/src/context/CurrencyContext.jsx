import React, { createContext, useContext, useState, useEffect } from 'react';

export const CURRENCY_CONFIG = {
  INR: { name: 'Indian Rupee', symbol: '₹', rate: 84.0, locale: 'en-IN', digits: 2 },
  USD: { name: 'US Dollar', symbol: '$', rate: 1.0, locale: 'en-US', digits: 2 },
  EUR: { name: 'Euro', symbol: '€', rate: 0.92, locale: 'de-DE', digits: 2 },
  GBP: { name: 'British Pound', symbol: '£', rate: 0.78, locale: 'en-GB', digits: 2 },
  JPY: { name: 'Japanese Yen', symbol: '¥', rate: 152.0, locale: 'ja-JP', digits: 0 },
  AED: { name: 'UAE Dirham', symbol: 'AED', rate: 3.67, locale: 'en-AE', digits: 2 },
  AUD: { name: 'Australian Dollar', symbol: 'A$', rate: 1.52, locale: 'en-AU', digits: 2 },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', rate: 1.38, locale: 'en-CA', digits: 2 },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', rate: 1.32, locale: 'en-SG', digits: 2 },
};

export const REFERENCE_DATE = 'October 2026';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('churnlens_currency') || 'INR';
  });

  const [rates, setRates] = useState(() => {
    const saved = localStorage.getItem('churnlens_custom_rates');
    return saved ? JSON.parse(saved) : CURRENCY_CONFIG;
  });

  const setCurrency = (code) => {
    if (rates[code]) {
      setCurrencyState(code);
      localStorage.setItem('churnlens_currency', code);
    }
  };

  const updateRate = (code, newRate) => {
    const updated = {
      ...rates,
      [code]: { ...rates[code], rate: parseFloat(newRate) }
    };
    setRates(updated);
    localStorage.setItem('churnlens_custom_rates', JSON.stringify(updated));
  };

  const resetRates = () => {
    setRates(CURRENCY_CONFIG);
    localStorage.removeItem('churnlens_custom_rates');
  };

  const currentCfg = rates[currency] || CURRENCY_CONFIG.INR;

  const convertUSD = (amountUSD) => {
    const val = Number(amountUSD) || 0;
    return val * currentCfg.rate;
  };

  const convertToUSD = (amountLocal) => {
    const val = Number(amountLocal) || 0;
    if (currentCfg.rate <= 0) return val;
    return val / currentCfg.rate;
  };

  const formatMoney = (amountUSD, options = {}) => {
    const val = Number(amountUSD) || 0;
    const converted = val * currentCfg.rate;
    const {
      decimals = currentCfg.digits,
      compact = false,
      showDecimals = true,
    } = options;

    if (compact) {
      // Custom Indian compact notation or standard Intl
      if (currency === 'INR') {
        const absVal = Math.abs(converted);
        if (absVal >= 10000000) {
          return `${currentCfg.symbol}${(converted / 10000000).toFixed(1)} Cr`;
        } else if (absVal >= 100000) {
          return `${currentCfg.symbol}${(converted / 100000).toFixed(1)} L`;
        } else if (absVal >= 1000) {
          return `${currentCfg.symbol}${(converted / 1000).toFixed(1)} k`;
        }
      }
      try {
        return new Intl.NumberFormat(currentCfg.locale, {
          style: 'currency',
          currency: currency,
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(converted);
      } catch (e) {
        return `${currentCfg.symbol}${converted.toFixed(0)}`;
      }
    }

    try {
      return new Intl.NumberFormat(currentCfg.locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: showDecimals ? decimals : 0,
        maximumFractionDigits: showDecimals ? decimals : 0,
      }).format(converted);
    } catch (e) {
      return `${currentCfg.symbol}${converted.toLocaleString(currentCfg.locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currentCfg,
        rates,
        updateRate,
        resetRates,
        convertUSD,
        convertToUSD,
        formatMoney,
        referenceDate: REFERENCE_DATE,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
}
