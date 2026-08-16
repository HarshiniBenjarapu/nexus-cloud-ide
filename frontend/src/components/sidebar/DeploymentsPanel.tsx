import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { showToast } from '../../store/uiSlice';
import { deploymentService, DeploymentRecord } from '../../services/deployment.service';
import { domainService, CustomDomain } from '../../services/domain.service';
import { Rocket, ExternalLink, CheckCircle2, RefreshCw, Sliders, Globe, Plus, Trash2, ShieldCheck, Link2, GitPullRequest } from 'lucide-react';

export const DeploymentsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { activeProjectId } = useSelector((state: RootState) => state.project);
  const [activeTab, setActiveTab] = useState<'deploy' | 'domains' | 'webhooks'>('deploy');

  // Deployments state
  const [provider, setProvider] = useState<'vercel' | 'netlify' | 'render' | 'aws_container'>('vercel');
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([
    { key: 'NODE_ENV', value: 'production' },
    { key: 'VITE_API_URL', value: 'https://api.nexus-cloud.app' },
  ]);

  // Domains state
  const [domainInput, setDomainInput] = useState('');
  const [domains, setDomains] = useState<CustomDomain[]>([
    {
      id: 'dom_1',
      projectId: activeProjectId || 'proj_default',
      domainName: 'app.nexus-dev.com',
      cnameTarget: 'cname.nexus-deploy.app',
      status: 'verified',
      sslStatus: 'active',
      createdAt: new Date().toISOString(),
    },
  ]);

  const fetchDeployments = async () => {
    if (!activeProjectId) return;
    try {
      const list = await deploymentService.getProjectDeployments(activeProjectId);
      setDeployments(list);
    } catch (err) {
      // Fallback list
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, [activeProjectId]);

  const handleTriggerDeploy = async () => {
    if (!activeProjectId) {
      dispatch(showToast({ message: 'No active project selected!', type: 'warning' }));
      return;
    }

    setIsDeploying(true);
    dispatch(showToast({ message: `Initiating deployment pipeline to ${provider.toUpperCase()}...`, type: 'info' }));

    try {
      const formattedEnv = envVars.reduce((acc, curr) => {
        if (curr.key.trim()) acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      const record = await deploymentService.triggerDeployment({
        projectId: activeProjectId,
        provider,
        envVars: formattedEnv,
      });

      setDeployments((prev) => [record, ...prev]);
      dispatch(showToast({ message: `Project successfully deployed to ${provider.toUpperCase()}!`, type: 'success' }));
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Deployment failed', type: 'error' }));
    } finally {
      setIsDeploying(false);
    }
  };

  const handleAddDomain = async () => {
    if (!domainInput.trim()) return;
    try {
      const newDom = await domainService.addDomain(activeProjectId || 'proj_default', domainInput.trim());
      setDomains((prev) => [newDom, ...prev]);
      setDomainInput('');
      dispatch(showToast({ message: `Custom domain ${domainInput} added! DNS verification pending.`, type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: 'Failed to add custom domain', type: 'error' }));
    }
  };

  const handleVerifyDomain = async (id: string) => {
    try {
      const updated = await domainService.verifyDomain(id);
      setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
      dispatch(showToast({ message: 'CNAME record & SSL Certificate verified!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: 'DNS CNAME record not found yet', type: 'warning' }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#171A1F] select-none p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#9DA5B4] uppercase tracking-wider">
          <Rocket className="w-4 h-4 text-[#C58A42]" />
          <span>Deployments & Domains</span>
        </div>
        <button
          onClick={() => setShowEnvModal(true)}
          className="p-1 hover:bg-white/10 text-[#9DA5B4] hover:text-white rounded-lg flex items-center space-x-1 text-[11px]"
          title="Configure Environment Variables"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Env Vars</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-[#0F1115] p-1 rounded-xl border border-white/5 text-[10px]">
        <button
          onClick={() => setActiveTab('deploy')}
          className={`py-1 rounded-lg font-medium transition-colors ${activeTab === 'deploy' ? 'bg-[#C58A42] text-white font-bold' : 'text-[#9DA5B4] hover:text-white'}`}
        >
          Deploy
        </button>
        <button
          onClick={() => setActiveTab('domains')}
          className={`py-1 rounded-lg font-medium transition-colors ${activeTab === 'domains' ? 'bg-[#C58A42] text-white font-bold' : 'text-[#9DA5B4] hover:text-white'}`}
        >
          Domains
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`py-1 rounded-lg font-medium transition-colors ${activeTab === 'webhooks' ? 'bg-[#C58A42] text-white font-bold' : 'text-[#9DA5B4] hover:text-white'}`}
        >
          CI/CD Webhooks
        </button>
      </div>

      {/* Tab Content 1: Deploy */}
      {activeTab === 'deploy' && (
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider">Target Cloud Provider</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'vercel', label: 'Vercel Edge' },
                { id: 'netlify', label: 'Netlify' },
                { id: 'render', label: 'Render' },
                { id: 'aws_container', label: 'AWS ECS' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setProvider(item.id as any)}
                  className={`py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center space-x-1 ${
                    provider === item.id
                      ? 'bg-[#C58A42]/20 border-[#C58A42] text-[#C58A42]'
                      : 'bg-[#0F1115] border-white/5 text-[#9DA5B4] hover:text-white'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleTriggerDeploy}
            disabled={isDeploying}
            className="w-full py-2 bg-[#C58A42] hover:bg-[#D69A4E] text-white font-medium rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-[#C58A42]/20 disabled:opacity-50"
          >
            {isDeploying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
            <span>{isDeploying ? 'Deploying to Edge...' : 'Deploy Active Project'}</span>
          </button>

          <div className="space-y-2 flex-1 overflow-y-auto">
            <div className="text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider">History ({deployments.length})</div>
            {deployments.map((dep) => (
              <div key={dep._id} className="p-2.5 bg-[#0F1115] border border-white/5 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">{dep.provider} Target</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#4CAF50]/15 text-[#4CAF50] font-mono border border-[#4CAF50]/30 flex items-center space-x-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>{dep.status}</span>
                  </span>
                </div>
                {dep.liveUrl && (
                  <a
                    href={dep.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-2 py-1 bg-[#20242B] hover:bg-white/10 rounded-lg text-[11px] text-[#4D8DFF] transition-colors"
                  >
                    <span className="truncate max-w-[160px] font-mono">{dep.liveUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: Custom Domains */}
      {activeTab === 'domains' && (
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-[#9DA5B4] uppercase tracking-wider">Add Custom Domain</label>
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="myproject.com"
                className="flex-1 bg-[#0F1115] border border-white/10 rounded-xl p-2 text-xs text-white placeholder-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42]"
              />
              <button
                onClick={handleAddDomain}
                className="px-3 py-2 bg-[#C58A42] hover:bg-[#D69A4E] text-white rounded-xl text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {domains.map((dom) => (
              <div key={dom.id} className="p-2.5 bg-[#0F1115] border border-white/5 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Link2 className="w-3.5 h-3.5 text-[#C58A42]" />
                    <span className="text-xs font-bold text-white">{dom.domainName}</span>
                  </div>
                  <button
                    onClick={() => handleVerifyDomain(dom.id)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                      dom.status === 'verified'
                        ? 'bg-[#4CAF50]/15 text-[#4CAF50] border-[#4CAF50]/30'
                        : 'bg-[#F2B94B]/15 text-[#F2B94B] border-[#F2B94B]/30'
                    }`}
                  >
                    {dom.status === 'verified' ? 'Verified' : 'Verify DNS'}
                  </button>
                </div>
                <div className="text-[10px] text-[#9DA5B4] font-mono bg-[#171A1F] p-1.5 rounded-lg border border-white/5">
                  CNAME Record: <span className="text-white">{dom.cnameTarget}</span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-[#4CAF50]">
                  <ShieldCheck className="w-3 h-3" />
                  <span>SSL Certificate: {dom.sslStatus.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 3: CI/CD Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="space-y-3 flex-1 flex flex-col min-h-0 text-xs">
          <div className="p-3 bg-[#0F1115] border border-white/5 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-white font-bold">
              <GitPullRequest className="w-4 h-4 text-[#C58A42]" />
              <span>GitHub Push Webhook</span>
            </div>
            <p className="text-[10px] text-[#9DA5B4]">Trigger automatic build deployments upon pushing to `main` branch.</p>
            <div className="p-2 bg-[#171A1F] rounded-lg font-mono text-[10px] text-[#4D8DFF] border border-white/5 break-all">
              http://localhost:5000/api/deployments/webhook/github
            </div>
          </div>

          <div className="p-3 bg-[#0F1115] border border-white/5 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-white font-bold">
              <GitPullRequest className="w-4 h-4 text-[#4CAF50]" />
              <span>GitLab Pipeline Webhook</span>
            </div>
            <p className="text-[10px] text-[#9DA5B4]">Automatic CI webhook trigger for GitLab repositories.</p>
            <div className="p-2 bg-[#171A1F] rounded-lg font-mono text-[10px] text-[#4CAF50] border border-white/5 break-all">
              http://localhost:5000/api/deployments/webhook/gitlab
            </div>
          </div>
        </div>
      )}

      {/* Environment Variables Modal */}
      {showEnvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md bg-[#171A1F] border border-white/10 rounded-2xl p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <Sliders className="w-4 h-4 text-[#C58A42]" />
                <span>Environment Variables</span>
              </div>
              <button onClick={() => setShowEnvModal(false)} className="text-[#9DA5B4] hover:text-white text-xs">✕</button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {envVars.map((env, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="KEY"
                    value={env.key}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEnvVars((prev) => prev.map((item, i) => (i === idx ? { ...item, key: val } : item)));
                    }}
                    className="flex-1 bg-[#0F1115] border border-white/10 rounded-lg p-2 text-xs text-white uppercase focus:outline-none focus:border-[#C58A42]"
                  />
                  <input
                    type="text"
                    placeholder="VALUE"
                    value={env.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEnvVars((prev) => prev.map((item, i) => (i === idx ? { ...item, value: val } : item)));
                    }}
                    className="flex-1 bg-[#0F1115] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#C58A42]"
                  />
                  <button onClick={() => setEnvVars((prev) => prev.filter((_, i) => i !== idx))} className="p-2 text-[#9DA5B4] hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setEnvVars((prev) => [...prev, { key: '', value: '' }])}
                className="px-3 py-1.5 bg-[#20242B] hover:bg-white/10 text-xs text-white rounded-lg border border-white/10 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5 text-[#4CAF50]" />
                <span>Add Variable</span>
              </button>
              <button
                onClick={() => {
                  setShowEnvModal(false);
                  dispatch(showToast({ message: 'Environment variables saved for deployment builds!', type: 'success' }));
                }}
                className="px-4 py-1.5 bg-[#C58A42] hover:bg-[#D69A4E] text-white text-xs font-medium rounded-lg"
              >
                Save Variables
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
