import React, { useState } from 'react';
import { Upload, Search, Filter, AlertCircle, Info, AlertTriangle, XCircle, CheckCircle, Moon, Sun } from 'lucide-react';

export default function JsonLogViewer() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [availableLevels, setAvailableLevels] = useState([]);
  const [stats, setStats] = useState({ total: 0, ignored: 0 });
  const [isDark, setIsDark] = useState(false);

  // Hierarchical log level order (lowest to highest severity)
  const levelHierarchy = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

  const extractJsonObjects = (content) => {
    const lines = content.split('\n');
    const jsonObjects = [];
    let ignoredLines = 0;

    for (let line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
        try {
          const jsonObj = JSON.parse(trimmedLine);
          jsonObjects.push(jsonObj);
        } catch (e) {
          ignoredLines++;
        }
      } else if (trimmedLine.length > 0) {
        ignoredLines++;
      }
    }

    return { jsonObjects, ignoredLines };
  };

  const extractLevels = (logs) => {
    const levels = new Set();
    logs.forEach(log => {
      const level = log.level || log.severity || log.log_level || log.logLevel;
      if (level) {
        levels.add(level.toString().toUpperCase());
      }
    });
    return ['ALL', ...Array.from(levels).sort()];
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const content = await file.text();
      const { jsonObjects, ignoredLines } = extractJsonObjects(content);
      
      setLogs(jsonObjects);
      setFilteredLogs(jsonObjects);
      setStats({ total: jsonObjects.length, ignored: ignoredLines });
      
      const levels = extractLevels(jsonObjects);
      setAvailableLevels(levels);
      setSelectedLevel('ALL');
      setSearchTerm('');
    } catch (error) {
      alert('Error reading file: ' + error.message);
    }
  };

  const getLogLevel = (log) => {
    const level = log.level || log.severity || log.log_level || log.logLevel;
    return level ? level.toString().toUpperCase() : 'UNKNOWN';
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    filterLogs(term, selectedLevel);
  };

  const handleLevelFilter = (level) => {
    setSelectedLevel(level);
    filterLogs(searchTerm, level);
  };

  const filterLogs = (term, level) => {
    let filtered = logs;

    if (level !== 'ALL') {
      // Hierarchical filtering: show selected level and all higher severity levels
      const selectedIndex = levelHierarchy.indexOf(level);
      if (selectedIndex !== -1) {
        const allowedLevels = levelHierarchy.slice(selectedIndex);
        filtered = filtered.filter(log => {
          const logLevel = getLogLevel(log);
          return allowedLevels.includes(logLevel);
        });
      } else {
        // If level not in hierarchy (e.g., SUCCESS), show only that level
        filtered = filtered.filter(log => getLogLevel(log) === level);
      }
    }

    if (term) {
      filtered = filtered.filter(log => 
        JSON.stringify(log).toLowerCase().includes(term.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const getLevelIcon = (level) => {
    const upperLevel = level.toUpperCase();
    if (upperLevel.includes('INFO')) return <Info className="w-4 h-4" />;
    if (upperLevel.includes('DEBUG')) return <AlertCircle className="w-4 h-4" />;
    if (upperLevel.includes('WARN')) return <AlertTriangle className="w-4 h-4" />;
    if (upperLevel.includes('ERROR') || upperLevel.includes('FATAL')) return <XCircle className="w-4 h-4" />;
    if (upperLevel.includes('SUCCESS')) return <CheckCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getLevelColor = (level) => {
    const upperLevel = level.toUpperCase();
    if (isDark) {
      if (upperLevel.includes('INFO')) return 'bg-blue-900 border-blue-700 text-blue-300';
      if (upperLevel.includes('DEBUG')) return 'bg-slate-700 border-slate-600 text-slate-300';
      if (upperLevel.includes('WARN')) return 'bg-yellow-900 border-yellow-700 text-yellow-300';
      if (upperLevel.includes('ERROR') || upperLevel.includes('FATAL')) return 'bg-red-900 border-red-700 text-red-300';
      if (upperLevel.includes('SUCCESS')) return 'bg-green-900 border-green-700 text-green-300';
      return 'bg-purple-900 border-purple-700 text-purple-300';
    } else {
      if (upperLevel.includes('INFO')) return 'bg-blue-50 border-blue-200 text-blue-700';
      if (upperLevel.includes('DEBUG')) return 'bg-gray-50 border-gray-200 text-gray-700';
      if (upperLevel.includes('WARN')) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      if (upperLevel.includes('ERROR') || upperLevel.includes('FATAL')) return 'bg-red-50 border-red-200 text-red-700';
      if (upperLevel.includes('SUCCESS')) return 'bg-green-50 border-green-200 text-green-700';
      return 'bg-purple-50 border-purple-200 text-purple-700';
    }
  };

  const formatValue = (value) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return value.toString();
  };

  const renderLogFields = (log) => {
    const messageFields = ['message', 'msg', 'text', 'description'];
    const message = messageFields.find(f => log[f]) ? log[messageFields.find(f => log[f])] : null;
    return { message };
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} mb-2`}>JSON Log Viewer</h1>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Extract and visualize JSON logs from any log file</p>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-3 rounded-lg transition-colors ${
              isDark 
                ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' 
                : 'bg-white hover:bg-slate-100 text-slate-700 shadow-md'
            }`}
          >
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {logs.length === 0 ? (
          <div className={`${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'} rounded-lg shadow-lg p-12 text-center border-2 border-dashed hover:border-blue-400 transition-colors`}>
            <Upload className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <h2 className={`text-2xl font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'} mb-2`}>Upload Log File</h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} mb-6`}>Select any log file containing JSON objects</p>
            <label className="inline-block">
              <input
                type="file"
                accept=".log,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-block font-medium">
                Choose File
              </span>
            </label>
          </div>
        ) : (
          <>
            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>JSON Objects Found</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{stats.ignored}</div>
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Lines Ignored</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{filteredLogs.length}</div>
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Currently Showing</div>
                </div>
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'} w-5 h-5`} />
                    <input
                      type="text"
                      placeholder="Search in logs..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400' 
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {availableLevels.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Filter className={`${isDark ? 'text-slate-400' : 'text-slate-600'} w-5 h-5`} />
                    <select
                      value={selectedLevel}
                      onChange={(e) => handleLevelFilter(e.target.value)}
                      className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-slate-700 border-slate-600 text-slate-200' 
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {availableLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                )}

                <label className="inline-block">
                  <input
                    type="file"
                    accept=".log,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className={`px-4 py-2 rounded-lg cursor-pointer transition-colors inline-block ${
                    isDark 
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                      : 'bg-slate-600 hover:bg-slate-700 text-white'
                  }`}>
                    Upload New
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              {filteredLogs.map((log, index) => {
                const level = getLogLevel(log);
                const { message } = renderLogFields(log);
                
                return (
                  <div
                    key={index}
                    className={`rounded-lg border p-3 ${getLevelColor(level)} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getLevelIcon(level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3">
                          <span className="font-bold text-sm min-w-16">{level}</span>
                          {message && (
                            <p className="text-sm font-medium whitespace-pre-wrap flex-1">{formatValue(message)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredLogs.length === 0 && (
              <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-md p-12 text-center`}>
                <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>No logs match your filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}