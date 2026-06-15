import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Send, 
  Terminal, 
  Coins, 
  TrendingUp, 
  ShieldAlert, 
  Sparkles,
  Server,
  RefreshCw,
  Clock
} from 'lucide-react';

const BACKEND_URL = 'http://127.0.0.1:8000';

function App() {
  const [metrics, setMetrics] = useState({
    traffic: 0,
    latency_p50: 0,
    latency_p95: 0,
    latency_p99: 0,
    avg_cost_usd: 0,
    total_cost_usd: 0,
    tokens_in_total: 0,
    tokens_out_total: 0,
    error_breakdown: {},
    quality_avg: 0,
  });

  const [incidents, setIncidents] = useState({
    rag_slow: false,
    tool_fail: false,
    cost_spike: false,
  });

  const [logs, setLogs] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'agent', text: 'Xin chào! Tôi là AI Assistant được tích hợp hệ thống kiểm tra Observability. Bạn muốn kiểm tra tính năng nào?', ts: new Date().toLocaleTimeString() }
  ]);

  // Keep a history of query latencies for visualization
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [costHistory, setCostHistory] = useState([]);

  const logsEndRef = useRef(null);
  const chatEndRef = useRef(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      // Fetch Metrics
      const metricsRes = await fetch(`${BACKEND_URL}/metrics`);
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      // Fetch Health / Incidents status
      const healthRes = await fetch(`${BACKEND_URL}/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        if (healthData.incidents) {
          setIncidents(healthData.incidents);
        }
      }

      // Fetch logs
      const logsRes = await fetch(`${BACKEND_URL}/logs?limit=40`);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (err) {
      console.error('Error fetching backend data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll metrics and logs every 15 seconds according to dashboard specification
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Scroll logs and chat to bottom on updates
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handle toggling incidents
  const handleToggleIncident = async (name) => {
    const isCurrentlyEnabled = incidents[name];
    const endpoint = isCurrentlyEnabled ? 'disable' : 'enable';
    try {
      const res = await fetch(`${BACKEND_URL}/incidents/${name}/${endpoint}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents);
        fetchData();
      }
    } catch (err) {
      console.error(`Error toggling incident ${name}:`, err);
    }
  };

  // Handle sending chat messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatMessage('');
    
    // Append user message immediately
    const userMsg = { role: 'user', text: userText, ts: new Date().toLocaleTimeString() };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      const started = performance.now();
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'u_react_dashboard',
          session_id: 's_react_sess_01',
          feature: 'qa',
          message: userText,
        }),
      });

      const latency = Math.round(performance.now() - started);

      if (res.ok) {
        const data = await res.json();
        
        // Append response to history
        const agentMsg = {
          role: 'agent',
          text: data.answer,
          ts: new Date().toLocaleTimeString(),
          latency_ms: data.latency_ms || latency,
          cost_usd: data.cost_usd,
          correlation_id: data.correlation_id,
        };
        
        setChatHistory(prev => [...prev, agentMsg]);
        
        // Update local chart histories
        setLatencyHistory(prev => [...prev.slice(-15), data.latency_ms || latency]);
        setCostHistory(prev => [...prev.slice(-15), data.cost_usd]);
        
        // Refresh metrics
        fetchData();
      } else {
        const errorText = await res.text();
        setChatHistory(prev => [...prev, {
          role: 'agent',
          text: `[Error 500] API call failed: ${errorText}`,
          ts: new Date().toLocaleTimeString(),
          isError: true,
        }]);
        setLatencyHistory(prev => [...prev.slice(-15), latency]);
        fetchData();
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
      setChatHistory(prev => [...prev, {
        role: 'agent',
        text: `Network Error: Không kết nối được tới backend FastAPI (${BACKEND_URL})`,
        ts: new Date().toLocaleTimeString(),
        isError: true,
      }]);
    }
  };

  const totalErrors = Object.values(metrics.error_breakdown || {}).reduce((a, b) => a + b, 0);
  const errorRatePct = metrics.traffic > 0 ? ((totalErrors / metrics.traffic) * 100).toFixed(1) : '0.0';

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div>
          <h1 className="app-title">
            <Activity className="text-purple-500" size={32} />
            Day 13: Observability Lab UI
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            React Control Panel & Real-time Metrics Dashboard
          </div>
        </div>
        <div className="app-badge">
          <div className="app-badge-active"></div>
          Backend Online: {BACKEND_URL}
        </div>
      </header>

      {/* Specification Indicator Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px', 
        padding: '12px 20px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderRadius: '16px', 
        border: '1px solid var(--border-color)', 
        fontSize: '14px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>Thời gian hiển thị: <strong>Gần nhất 1 giờ (1 Hour Window)</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--accent-purple)' }} />
            <span>Tự động làm mới: <strong>15 giây</strong></span>
          </div>
          <button 
            onClick={fetchData} 
            className="refresh-btn" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'var(--bg-tertiary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '6px 12px', 
              color: 'var(--text-primary)', 
              cursor: 'pointer', 
              fontSize: '12px',
              transition: 'background 0.2s'
            }}
          >
            <RefreshCw size={12} />
            Làm mới ngay
          </button>
        </div>
      </div>

      {/* Metrics Dashboard Row */}
      <div className="dashboard-grid">
        <div className="card metric-card border-purple">
          <div className="metric-label">Tổng Traffic (Requests)</div>
          <div className="metric-value">{metrics.traffic} reqs</div>
          <div className="metric-sub">Lượt truy vấn API tích lũy</div>
        </div>
        <div className="card metric-card border-cyan">
          <div className="metric-label">Latency P99 / P95 / P50</div>
          <div className="metric-value">
            {metrics.latency_p99}ms <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/ {metrics.latency_p95}ms / {metrics.latency_p50}ms</span>
          </div>
          <div className="metric-sub">SLO P95 &lt; 3000ms</div>
        </div>
        <div className="card metric-card border-green">
          <div className="metric-label">Tổng Chi Phí (Cost)</div>
          <div className="metric-value">${metrics.total_cost_usd.toFixed(4)}</div>
          <div className="metric-sub">SLO Budget &lt; $2.50/ngày</div>
        </div>
        <div className="card metric-card border-amber">
          <div className="metric-label">Tokens In / Out</div>
          <div className="metric-value" style={{ fontSize: '24px', paddingTop: '10px' }}>
            {metrics.tokens_in_total} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>in</span> / {metrics.tokens_out_total} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>out</span>
          </div>
          <div className="metric-sub">Đơn vị: tokens tích lũy</div>
        </div>
        <div className="card metric-card border-red">
          <div className="metric-label">Tỷ lệ Lỗi (Error Rate)</div>
          <div className="metric-value" style={{ color: parseFloat(errorRatePct) > 2.0 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
            {errorRatePct}%
          </div>
          <div className="metric-sub">
            {totalErrors > 0 
              ? `${totalErrors} lỗi | SLO < 2% (Breached)` 
              : 'SLO &lt; 2% | Không có lỗi'}
          </div>
        </div>
        <div className="card metric-card border-purple">
          <div className="metric-label">Chất Lượng AI (Quality)</div>
          <div className="metric-value" style={{ color: (metrics.quality_avg * 100) < 75 && metrics.traffic > 0 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
            {(metrics.quality_avg * 100).toFixed(0)}%
          </div>
          <div className="metric-sub">
            {(metrics.quality_avg * 100) < 75 && metrics.traffic > 0
              ? 'SLO &gt; 75% (Breached)'
              : 'SLO &gt; 75% | Đạt yêu cầu'}
          </div>
        </div>
      </div>

      {/* Visual Live Charts */}
      <div className="charts-row">
        <div className="card">
          <div className="section-title">
            <Clock size={18} style={{ color: 'var(--accent-cyan)' }} />
            Đồ thị độ trễ các Request gần đây (Latency History)
          </div>
          <div className="chart-container" style={{ position: 'relative' }}>
            {/* SLO Threshold Line at 3000ms (75% of 4000ms max scale) */}
            <div style={{ 
              position: 'absolute', 
              left: 0, 
              right: 0, 
              bottom: '75%', 
              borderTop: '2px dashed var(--accent-red)',
              opacity: 0.8,
              zIndex: 10
            }}>
              <span style={{ 
                position: 'absolute', 
                right: '8px', 
                bottom: '2px', 
                fontSize: '9px', 
                color: 'var(--accent-red)',
                backgroundColor: 'var(--bg-secondary)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>SLO Threshold: 3000ms</span>
            </div>

            {latencyHistory.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', margin: 'auto', fontSize: '14px', zIndex: 11 }}>
                Chưa có dữ liệu. Gửi tin nhắn chat để vẽ đồ thị.
              </div>
            ) : (
              latencyHistory.map((lat, idx) => {
                const heightPercent = Math.min(100, (lat / 4000) * 100);
                const isSlow = lat > 1000;
                return (
                  <div 
                    key={idx} 
                    className={`chart-bar ${isSlow ? 'slow' : ''}`} 
                    style={{ height: `${heightPercent}%`, zIndex: 5 }}
                    title={`Request #${idx + 1}: ${lat}ms`}
                  />
                );
              })
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', color: 'var(--text-muted)' }}>
            <span>Thứ tự request (cũ hơn)</span>
            <span style={{ color: 'var(--accent-red)' }}>Đỏ: Latency &gt; 1s | Trục Y: 4000ms max</span>
            <span>Mới nhất</span>
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <Coins size={18} style={{ color: 'var(--accent-green)' }} />
            Đồ thị chi phí Request gần đây (Cost History)
          </div>
          <div className="chart-container">
            {costHistory.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', margin: 'auto', fontSize: '14px' }}>
                Chưa có dữ liệu. Gửi tin nhắn chat để vẽ đồ thị.
              </div>
            ) : (
              costHistory.map((cost, idx) => {
                // Max standard token cost around $0.005 for visualization scaling
                const heightPercent = Math.min(100, (cost / 0.005) * 100);
                return (
                  <div 
                    key={idx} 
                    className="chart-bar" 
                    style={{ height: `${heightPercent}%`, backgroundColor: 'var(--accent-green)' }}
                    title={`Request #${idx + 1}: $${cost.toFixed(5)}`}
                  />
                );
              })
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', color: 'var(--text-muted)' }}>
            <span>Thứ tự request (cũ hơn)</span>
            <span>Tỷ lệ scale: $0.005 max</span>
            <span>Mới nhất</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Left column: Controls and Chat Client */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Incident injection control panel */}
          <div className="card border-red">
            <div className="section-title" style={{ color: 'var(--accent-red)' }}>
              <ShieldAlert size={20} />
              Trình giả lập sự cố (Incident Injector)
            </div>
            <div className="incidents-container">
              
              <div className="incident-row">
                <div className="incident-info">
                  <span className="incident-name">RAG Slowdown (rag_slow)</span>
                  <span className="incident-desc">Độ trễ RAG tăng thêm 2.5 giây</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={incidents.rag_slow} 
                    onChange={() => handleToggleIncident('rag_slow')} 
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="incident-row">
                <div className="incident-info">
                  <span className="incident-name">Tool DB Timeout Failure (tool_fail)</span>
                  <span className="incident-desc">Cơ sở dữ liệu Vector RAG trả về mã lỗi 500</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={incidents.tool_fail} 
                    onChange={() => handleToggleIncident('tool_fail')} 
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="incident-row">
                <div className="incident-info">
                  <span className="incident-name">LLM Output Cost Spike (cost_spike)</span>
                  <span className="incident-desc">Mô hình nhân số lượng token sinh lên gấp 4 lần</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={incidents.cost_spike} 
                    onChange={() => handleToggleIncident('cost_spike')} 
                  />
                  <span className="slider"></span>
                </label>
              </div>

            </div>
          </div>

          {/* Chat Simulator */}
          <div className="card">
            <div className="section-title">
              <Sparkles size={20} style={{ color: 'var(--accent-purple)' }} />
              Hộp kiểm thử Chat (Chat Simulator)
            </div>
            <div className="chat-container">
              <div className="chat-history">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`chat-bubble ${msg.role}`}>
                    <div>{msg.text}</div>
                    <div className="chat-meta">
                      <span>{msg.ts}</span>
                      {msg.latency_ms && <span>Latency: {msg.latency_ms}ms</span>}
                      {msg.cost_usd > 0 && <span>Cost: ${msg.cost_usd.toFixed(4)}</span>}
                      {msg.correlation_id && <span style={{ color: 'var(--accent-cyan)' }}>ID: {msg.correlation_id}</span>}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="chat-input-row">
                <input 
                  type="text" 
                  className="chat-input" 
                  placeholder="Gửi câu hỏi... (ví dụ: What is the refund policy? email: me@vn.vn)"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
                <button type="submit" className="chat-submit-btn">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Right column: Logs Console */}
        <div className="card logs-viewer">
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={20} style={{ color: 'var(--accent-green)' }} />
              Dòng Log máy chủ thời gian thực (Terminal JSON Logs)
            </span>
            <button 
              onClick={fetchData} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Làm mới log"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="logs-console">
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>
                Đang lắng nghe log... Hãy gửi yêu cầu chat hoặc bật sự cố để sinh log.
              </div>
            ) : (
              logs.map((logItem, idx) => {
                const ts = logItem.ts ? new Date(logItem.ts).toLocaleTimeString() : '';
                let logClass = 'info';
                if (logItem.level === 'warning') logClass = 'warning';
                if (logItem.level === 'error' || logItem.level === 'critical') logClass = 'error';
                
                return (
                  <div key={idx} className={`log-line ${logClass}`}>
                    <span className="log-ts">[{ts}]</span>
                    {logItem.service && <span className="log-service">[{logItem.service}]</span>}
                    {logItem.correlation_id && logItem.correlation_id !== 'MISSING' && (
                      <span className="log-cid">({logItem.correlation_id})</span>
                    )}
                    <span>
                      {logItem.event} 
                      {logItem.payload && ` | payload: ${JSON.stringify(logItem.payload)}`}
                      {logItem.latency_ms && ` | latency: ${logItem.latency_ms}ms`}
                      {logItem.cost_usd && ` | cost: $${logItem.cost_usd}`}
                      {logItem.error_type && ` | error: ${logItem.error_type}`}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      <footer style={{ marginTop: 'auto', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        Day 13 Observability Lab — React Client Panel Dashboard. Tự động hóa giám sát & Báo cáo sự cố.
      </footer>
    </div>
  );
}

export default App;
