import { useEffect, useState, useRef, startTransition } from 'react';
import './App.css';

const BASE_URL = import.meta.env.VITE_API_URL;

function App() {
    const [amount, setAmount] = useState(0);
    const [intervalSec, setIntervalSec] = useState(0);
    const [botActive, setBotActive] = useState(false);
    const [tokenList, setTokenList] = useState([]);
    const [slippage, setSlippage] = useState(0.5);
    const [privateKey, setPrivateKey] = useState('');
    const [rpcURL, setRpcUrl] = useState('');
    const [minLiquidity, setMinLiquidity] = useState(0);
    const [topHoldersPercentage, setTopHoldersPercentage] = useState(0);
    const [isConfigUpdated, setIsConfigUpdated] = useState(false);

    // Login State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [stats, setStats] = useState({
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalBuys: 0,
        totalSells: 0,
        totalBuyingAmount: 0,
        totalSellingAmount: 0,
        successfulBuys: 0,
        successfulSells: 0,
        failedBuys: 0,
        failedSells: 0,
        totalProfit: 0,
        winRate: '0.00',
        avgGrowth: '0.00',
        avgLoss: '0.00',
        rugPull: '0.00',
    });

    const intervalRef = useRef(null);
    // const { connection } = useConnection();
    // const { publicKey } = useWallet();

    // Inside your state section
    const [tradeLogs, setTradeLogs] = useState([]);

    // Example fetch from backend (in fetchStats or a separate API)
    const fetchTradeLogs = async () => {
        try {
            const res = await fetch(`${BASE_URL}/getTradeLogs`, {
                credentials: 'include', // important
            });
            const data = await res.json();

            // console.log(data);

            setTradeLogs(data); // Expecting array of trade log objects
        } catch (err) {
            console.error('Error fetching trade logs:', err);
        }
    };

    const fetchStats = async () => {
        try {
            const statsResponse = await fetch(`${BASE_URL}/getStats`, {
                method: 'GET',
                credentials: 'include', // important
            });
            const statsResult = await statsResponse.json();
            // console.log("====>   ", statsResult);

            setStats((prevStats) => ({
                ...prevStats,
                totalTrades: statsResult.totalTrades,
                successfulTrades: statsResult.successfulTrades,
                failedTrades: statsResult.failedTrades,
                totalBuys: statsResult.totalBuys,
                totalSells: statsResult.totalSells,
                totalSellingAmount: statsResult.totalSellingAmount,
                totalBuyingAmount: statsResult.totalBuyingAmount,
                successfulBuys: statsResult.successfulBuys,
                successfulSells: statsResult.successfulSells,
                failedBuys: statsResult.failedBuys,
                failedSells: statsResult.failedSells,
                totalProfit: statsResult.totalProfit,
                winRate: statsResult.winRate,
                avgGrowth: statsResult.avgGrowth,
                avgLoss: statsResult.avgLoss,
                // rugPull: 0.00 // statsResult.rugPull
            }));

            setBotActive(statsResult.botStatus);

            setIsConfigUpdated(statsResult.isConfigUpdated);
        } catch (error) {
            console.log('Error := ', error);
            // alert('Error fetching the statistics!');
        }
    };

    const fetchTokens = async () => {
        try {
            const res = await fetch('https://lite-api.jup.ag/tokens/v2/recent');
            const tokens = await res.json();

            await fetchStats();
            await fetchTradeLogs();

            setTokenList(tokens.slice(0, 30));
        } catch (err) {
            console.error('Error fetching tokens:', err);
        }
    };

    const submitBackendConfig = async () => {
        try {
            const response = await fetch(`${BASE_URL}/set-bot-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // important
                body: JSON.stringify({
                    amount,
                    minLiquidity,
                    inputMint: 'So11111111111111111111111111111111111111112',
                    slippageBps: slippage,
                    sellTimer: intervalSec,
                    privateKey: privateKey.trim(),
                    rpcURL,
                    topHoldersPercentage,
                }),
            });
            const result = await response.json();

            if (result.status != 200) {
                alert(result.message);
            } else {
                setIsConfigUpdated(true);
                alert('Configuration updated ✅');
            }
        } catch (err) {
            alert('Error setting config ❌');
            console.error(err);
        }
    };

    const toggleBot = async () => {
        try {
            const response = await fetch(`${BASE_URL}/toggleBot`, {
                method: 'PUT',
                credentials: 'include', // important
                headers: { 'Content-Type': 'application/json' },
            });

            const result = await response.json();
            console.log(result);

            setBotActive(result.botStatus);

            alert(`${result.message} ✅`);
        } catch (err) {
            alert('Error toggling bot ❌');
            console.error(err);
        }
    };

    const handleLogin = async () => {
        try {
            const res = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // important
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                setIsAuthenticated(true);
                alert('Logged in successfully ✅');
            } else {
                alert(data.message || 'Login failed ❌');
            }
        } catch (err) {
            console.error(err);
            alert('Login error ❌');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
    };

    const resetStatsButtonBtnClick = async () => {
        try {
            const res = await fetch(`${BASE_URL}/resetTradeStats`, {
                method: 'POST',
                credentials: 'include',
            });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
            }
        } catch (err) {
            console.error('Error resetting logs:', err);
        }
    };

    function calculateProfit(profitAmount) {
        if (profitAmount == 0) {
            return 0;
        } else if (profitAmount > 0) {
            return '+' + profitAmount.toFixed(8);
        } else {
            return profitAmount.toFixed(8);
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            fetchStats();
            fetchTradeLogs();
        }
    }, []);

    useEffect(() => {
        if (botActive) {
            intervalRef.current = setInterval(fetchTokens, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [botActive, intervalSec]);

    return (
        <div className="container">
            {!isAuthenticated ? (
                <div className="login-form">
                    <h2>🔐 Login</h2>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={handleLogin}>Login</button>
                </div>
            ) : (
                <>
                    <div className="wallet-info">
                        <button onClick={handleLogout}>Logout</button>
                    </div>

                    <h1 className="title">Solana Sniper Bot</h1>

                    <div className="config-form">
                        <h2>Configuration</h2>
                        <div className="config-grid">
                            <label>
                                Amount (in SOL):
                                <input
                                    type="number"
                                    className="input"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={botActive}
                                />
                            </label>
                            <label>
                                Sell Timer (seconds):
                                <input
                                    type="number"
                                    className="input"
                                    value={intervalSec}
                                    onChange={(e) =>
                                        setIntervalSec(e.target.value)
                                    }
                                    disabled={botActive}
                                />
                            </label>
                            <label>
                                Slippage (%):
                                <select
                                    className="input"
                                    value={slippage}
                                    onChange={(e) =>
                                        setSlippage(Number(e.target.value))
                                    }
                                    disabled={botActive}
                                >
                                    {[0.01, 0.1, 0.5, 1, 3, 5, 10].map((s) => (
                                        <option key={s} value={s}>
                                            {s}%
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Min. Liquidity (USD):
                                <input
                                    type="number"
                                    className="input"
                                    value={minLiquidity}
                                    onChange={(e) =>
                                        setMinLiquidity(e.target.value)
                                    }
                                    disabled={botActive}
                                />
                            </label>
                            <label>
                                Top Holder %:
                                <input
                                    type="number"
                                    className="input"
                                    value={topHoldersPercentage}
                                    onChange={(e) =>
                                        setTopHoldersPercentage(e.target.value)
                                    }
                                    disabled={botActive}
                                />
                            </label>
                            <label>
                                RPC URL:
                                <input
                                    type="text"
                                    className="input"
                                    value={rpcURL}
                                    placeholder="https://example-rpc-url.com"
                                    onChange={(e) => setRpcUrl(e.target.value)}
                                    disabled={botActive}
                                />
                            </label>
                            <label>
                                Private Key (base58):
                                <input
                                    type="password"
                                    className="input"
                                    value={privateKey}
                                    placeholder="0x0abc"
                                    onChange={(e) =>
                                        setPrivateKey(e.target.value)
                                    }
                                    disabled={botActive}
                                />
                            </label>
                        </div>
                        <div className="button-row">
                            <button
                                onClick={submitBackendConfig}
                                disabled={botActive}
                            >
                                Set Config
                            </button>
                            <button
                                onClick={toggleBot}
                                disabled={!isConfigUpdated}
                                className={botActive ? 'stop' : 'start'}
                            >
                                {botActive ? 'Stop' : 'Start'} Bot
                            </button>
                            <span
                                className={`bot-status ${
                                    botActive ? 'running' : 'inactive'
                                }`}
                            >
                                {botActive
                                    ? '✅ Bot is running'
                                    : '⛔ Bot is inactive'}
                            </span>
                        </div>
                    </div>

                    <div className="stats-and-logs">
                        {/* Trade Stats */}
                        <div className="stats-section">
                            <div className="stats-panel">
                                {/* Header row with flex */}
                                <div className="stats-header">
                                    <h2>📊 Trade Stats</h2>
                                    <button
                                        className="reset-btn"
                                        onClick={resetStatsButtonBtnClick}
                                    >
                                        Reset Stats
                                    </button>
                                </div>

                                {/* Stats Cards */}
                                <div className="stats-cards">
                                    {/* Successful */}
                                    <div className="stats-card">
                                        <h3>Successful</h3>
                                        <ul>
                                            <li>
                                                <span>✅ Successful Buys:</span>{' '}
                                                <strong>
                                                    {stats.successfulBuys}
                                                </strong>
                                            </li>
                                            <li>
                                                <span>
                                                    ✅ Successful Sells:
                                                </span>{' '}
                                                <strong>
                                                    {stats.successfulSells}
                                                </strong>
                                            </li>
                                            <li>
                                                <span>❌ Failed Sells:</span>{' '}
                                                <strong>
                                                    {stats.failedSells}
                                                </strong>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Trades */}
                                    <div className="stats-card">
                                        <h3>Trades</h3>
                                        <ul>
                                            <li>
                                                <span>📊 Total Profit:</span>{' '}
                                                <strong>
                                                    {stats.totalProfit}
                                                </strong>
                                            </li>
                                            <li>
                                                <span>
                                                    💰 Total Buy Amount:
                                                </span>{' '}
                                                <strong>
                                                    {stats.totalBuyingAmount}
                                                </strong>
                                            </li>
                                            <li>
                                                <span>
                                                    💵 Total Sell Amount:
                                                </span>{' '}
                                                <strong>
                                                    {stats.totalSellingAmount}
                                                </strong>
                                            </li>
                                            <li>
                                                <span>
                                                    📈 Profitable Trades:
                                                </span>{' '}
                                                <strong>
                                                    {stats.successfulTrades}
                                                </strong>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Performance */}
                                    <div className="stats-card">
                                        <h3>Performance</h3>
                                        <ul>
                                            <li>
                                                <span>🏆 Win Rate %:</span>{' '}
                                                <strong>{stats.winRate}</strong>
                                            </li>
                                            <li>
                                                <span>📈 Avg Growth %:</span>{' '}
                                                <strong>
                                                    {stats.avgGrowth}%
                                                </strong>
                                            </li>
                                            <li>
                                                <span>📉 Avg Loss %:</span>{' '}
                                                <strong>
                                                    {stats.avgLoss}%
                                                </strong>
                                            </li>
                                            <li>
                                                <span>⚠️ Rugpull %:</span>{' '}
                                                <strong>
                                                    {stats.rugPull}%
                                                </strong>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Trade Logs */}
                        <div className="trade-logs-section">
                            <div className="trade-logs-header">
                                <h2 className="trade-logs-title">
                                    📜 Trade Logs
                                </h2>
                            </div>
                            <div className="trade-logs-wrapper">
                                <table className="trade-logs-table">
                                    <thead>
                                        <tr>
                                            <th>Token</th>
                                            <th>Address</th>
                                            <th>Buy Amount</th>
                                            <th>Sell Amount</th>
                                            <th>Profit/Loss</th>
                                            <th>Percentage(%)</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tradeLogs.length > 0 ? (
                                            tradeLogs.map((log, index) => (
                                                <tr
                                                    key={index}
                                                    className={
                                                        !log.isSellFailed
                                                            ? log.type === 'BUY'
                                                                ? ''
                                                                : log.profitLoss >=
                                                                  0
                                                                ? log.profitLoss ===
                                                                      0 ||
                                                                  log.profitLoss ===
                                                                      null
                                                                    ? ''
                                                                    : 'buy-row'
                                                                : 'sell-row'
                                                            : 'failed-row'
                                                    }
                                                >
                                                    <td>{log.name}</td>
                                                    <td>
                                                        <a
                                                            href={`https://solscan.io/token/${log.address}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            {log.address.slice(
                                                                0,
                                                                6
                                                            )}
                                                            ...
                                                            {log.address.slice(
                                                                -4
                                                            )}
                                                        </a>
                                                    </td>
                                                    <td>
                                                        {(
                                                            Number(
                                                                log.buyAmount
                                                            ) / 1e9
                                                        ).toFixed(9)}
                                                    </td>
                                                    <td>
                                                        {log.sellAmount
                                                            ? (
                                                                  Number(
                                                                      log.sellAmount
                                                                  ) / 1e9
                                                              ).toFixed(9)
                                                            : 'Pending...'}
                                                    </td>
                                                    <td>
                                                        {log.profitLoss
                                                            ? (
                                                                  Number(
                                                                      log.profitLoss
                                                                  ) / 1e9
                                                              ).toFixed(9)
                                                            : 'Pending...'}
                                                    </td>
                                                    <td>
                                                        {log.growthPercent
                                                            ? Number(
                                                                  log.growthPercent
                                                              ).toFixed(2) + '%'
                                                            : 'Pending...'}
                                                    </td>
                                                    <td>
                                                        {new Date(
                                                            log.time
                                                        ).toISOString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="7"
                                                    style={{
                                                        textAlign: 'center',
                                                        color: '#aaa',
                                                    }}
                                                >
                                                    No trade logs yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right: Recent Tokens */}
                    <div>
                        <h2 className="token-title">30 Recent Tokens</h2>
                        <div className="token-grid">
                            {tokenList?.length ? (
                                tokenList.map((token) => (
                                    <div key={token.id} className="token-card">
                                        <img
                                            src={
                                                token.icon ||
                                                'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg'
                                            }
                                            alt={token.symbol}
                                            className="token-icon"
                                        />
                                        <div>
                                            <strong>{token.symbol}</strong>
                                            <div className="token-address">
                                                {token.id.slice(0, 10)}...
                                            </div>
                                            <div className="token-liquidity">
                                                Liquidity:{' '}
                                                {Number(
                                                    token.liquidity
                                                ).toFixed(3) || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <h3 className="no-tokens-msg">
                                    🚫 Bot is not active — no tokens fetched
                                </h3>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
