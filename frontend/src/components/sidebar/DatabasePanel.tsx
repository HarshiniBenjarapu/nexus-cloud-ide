import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { databaseService } from '../../services/database.service';
import { Database, Server, Play, CheckCircle2, RefreshCw, Layers, Plus } from 'lucide-react';

export const DatabasePanel: React.FC = () => {
  const dispatch = useDispatch();
  const [dbType, setDbType] = useState<'mongodb' | 'postgresql'>('mongodb');
  const [connectionString, setConnectionString] = useState(
    'mongodb+srv://nexus_admin:******@cluster0.mongodb.net/nexus_cloud_db'
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [collections, setCollections] = useState<{ name: string; count: number; size: string }[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await databaseService.connect({ dbType, connectionString });
      const data = await databaseService.getCollections(dbType);
      setCollections(data.collections || []);
      setIsConnected(true);
      dispatch(showToast({ message: `Successfully connected to ${dbType.toUpperCase()} database!`, type: 'success' }));
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Failed to connect to database', type: 'error' }));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRunQuery = async (colName: string) => {
    setSelectedCollection(colName);
    setIsQuerying(true);
    try {
      const data = await databaseService.query(colName);
      setQueryResult(data);
      dispatch(showToast({ message: `Query executed on collection '${colName}'`, type: 'success' }));
    } catch (err: any) {
      dispatch(showToast({ message: 'Query execution failed', type: 'error' }));
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#171A1F] select-none p-3 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#9DA5B4] uppercase tracking-wider">
          <Database className="w-4 h-4 text-[#4D8DFF]" />
          <span>Database Explorer</span>
        </div>
      </div>

      {/* Connection Form */}
      <div className="bg-[#0F1115] border border-white/10 rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Target Database</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              isConnected ? 'bg-[#4CAF50]/15 text-[#4CAF50]' : 'bg-white/10 text-[#9DA5B4]'
            }`}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setDbType('mongodb')}
            className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              dbType === 'mongodb'
                ? 'bg-[#4CAF50]/15 border-[#4CAF50] text-[#4CAF50]'
                : 'bg-[#171A1F] border-white/10 text-[#9DA5B4]'
            }`}
          >
            MongoDB
          </button>
          <button
            onClick={() => setDbType('postgresql')}
            className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              dbType === 'postgresql'
                ? 'bg-[#4D8DFF]/15 border-[#4D8DFF] text-[#4D8DFF]'
                : 'bg-[#171A1F] border-white/10 text-[#9DA5B4]'
            }`}
          >
            PostgreSQL
          </button>
        </div>

        <input
          type="text"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
          className="w-full bg-[#171A1F] border border-white/10 rounded-lg p-2 text-xs text-white placeholder-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42]"
        />

        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full py-1.5 bg-[#C58A42] hover:bg-[#D69A4E] text-white font-medium rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors"
        >
          {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
          <span>{isConnected ? 'Reconnect DB' : 'Connect DB'}</span>
        </button>
      </div>

      {/* Collections / Tables Browser */}
      {isConnected && (
        <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
          <div className="text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider">Collections / Tables ({collections.length})</div>
          <div className="space-y-1 overflow-y-auto max-h-40">
            {collections.map((col) => (
              <div
                key={col.name}
                onClick={() => handleRunQuery(col.name)}
                className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                  selectedCollection === col.name
                    ? 'bg-[#C58A42]/15 border-[#C58A42] text-white'
                    : 'bg-[#0F1115] border-white/5 text-[#9DA5B4] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Layers className="w-3.5 h-3.5 text-[#C58A42]" />
                  <span>{col.name}</span>
                </div>
                <span className="text-[10px] text-[#9DA5B4]">{col.count} docs</span>
              </div>
            ))}
          </div>

          {/* Query Result Grid */}
          {queryResult && (
            <div className="flex-1 bg-[#0F1115] border border-white/10 rounded-xl p-2.5 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between text-[10px] text-[#4CAF50] border-b border-white/5 pb-1">
                <span>QueryResult: {queryResult.collection}</span>
                <span>{queryResult.executionTimeMs}ms</span>
              </div>
              <pre className="font-mono text-[10px] text-white/90 overflow-x-auto">
                {JSON.stringify(queryResult.documents, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
