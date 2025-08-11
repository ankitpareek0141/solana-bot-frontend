import { useEffect, useState, useRef, startTransition } from 'react';
import './App.css';

const BASE_URL = "http://srv951924.hstgr.cloud:3001";

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
        winRate: '0.00%',
        totalProfit: 0,
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
                credentials: "include", // important
            });
            const data = await res.json();
            console.log(data);

            setTradeLogs(data); // Expecting array of trade log objects
        } catch (err) {
            console.error('Error fetching trade logs:', err);
        }
    };

    const fetchStats = async () => {
        try {
            const statsResponse = await fetch(
                `${BASE_URL}/getStats`,
                {
                    method: 'GET',
                    credentials: "include", // important
                }
            );
            const statsResult = await statsResponse.json();
            // console.log("====>   ", statsResult);

            console.log(statsResult.winRate);

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
                winRate: statsResult.winRate,
                totalProfit: statsResult.totalProfit,
            }));

            setBotActive(statsResult.botStatus);
            console.log(statsResult.isConfigUpdated);

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
            const response = await fetch(
                `${BASE_URL}/set-bot-config`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include", // important
                    body: JSON.stringify({
                        amount,
                        minLiquidity,
                        inputMint:
                            'So11111111111111111111111111111111111111112',
                        slippageBps: slippage,
                        sellTimer: intervalSec,
                        privateKey: privateKey.trim(),
                        rpcURL,
                        topHoldersPercentage,
                    }),
                }
            );
            const result = await response.json();
            console.log(result);

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
                credentials: "include", // important
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
                credentials: "include", // important
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
                                    disabled={isConfigUpdated}
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
                                    disabled={isConfigUpdated}
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
                                    disabled={isConfigUpdated}
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
                                    disabled={isConfigUpdated}
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
                                    disabled={isConfigUpdated}
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
                                    disabled={isConfigUpdated}
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
                                    disabled={isConfigUpdated}
                                />
                            </label>
                        </div>
                        <div className="button-row">
                            <button onClick={submitBackendConfig}>
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

                    {/* Left: Trade Stats */}
                    <div className="stats-and-logs">
                        {/* Trade Stats */}
                        <div className="stats-panel">
                            <h2>📊 Trade Stats</h2>
                            <div className="stats-grid cool-stats">
                                <div>
                                    <strong>Total Trades:</strong>{' '}
                                    {stats.totalTrades}
                                </div>
                                <div>
                                    <strong>Successful Trades:</strong>{' '}
                                    {stats.successfulTrades}
                                </div>
                                <div>
                                    <strong>Failed Trades:</strong>{' '}
                                    {stats.failedTrades}
                                </div>
                                <div>
                                    <strong>Total Buys:</strong>{' '}
                                    {stats.totalBuys}
                                </div>
                                <div>
                                    <strong>Total Sells:</strong>{' '}
                                    {stats.totalSells}
                                </div>
                                <div>
                                    <strong>Successful Buys:</strong>{' '}
                                    {stats.successfulBuys}
                                </div>
                                <div>
                                    <strong>Successful Sells:</strong>{' '}
                                    {stats.successfulSells}
                                </div>
                                <div>
                                    <strong>Failed Buys:</strong>{' '}
                                    {stats.failedBuys}
                                </div>
                                <div>
                                    <strong>Failed Sells:</strong>{' '}
                                    {stats.failedSells}
                                </div>
                                <div>
                                    <strong>Total Buy Amount:</strong>{' '}
                                    {stats.totalBuyingAmount}
                                </div>
                                <div>
                                    <strong>Total Sell Amount:</strong>{' '}
                                    {stats.totalSellingAmount}
                                </div>
                                <div>
                                    <strong>Total Profit:</strong>{' '}
                                    {stats.totalProfit}
                                </div>
                                <div>
                                    <strong>Win Rate:</strong> {stats.winRate}
                                </div>
                            </div>
                        </div>

                        {/* Trade Logs */}
                        <div className="trade-logs-section">
                            <h2>📜 Trade Logs</h2>
                            <div className="trade-logs-wrapper">
                                <table className="trade-logs-table">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Token</th>
                                            <th>Address</th>
                                            <th>Amount</th>
                                            <th>Price</th>
                                            <th>Profit/Loss</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tradeLogs.length > 0 ? (
                                            tradeLogs.map((log, index) => (
                                                <tr
                                                    key={index}
                                                    className={
                                                        log.type === 'BUY'
                                                            ? 'buy-row'
                                                            : 'sell-row'
                                                    }
                                                >
                                                    <td>{log.type}</td>
                                                    <td>{log.token}</td>
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
                                                    <td>{log.amount}</td>
                                                    <td>
                                                        {log.price.toFixed(9)}
                                                    </td>
                                                    <td>
                                                        {(log.profitLoss > 0 ? "+" : "-") + log.profitLoss.toFixed(9)}
                                                    </td>
                                                    <td>
                                                        {new Date(
                                                            log.time
                                                        ).toLocaleString()}
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
