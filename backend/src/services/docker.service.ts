import Docker from 'dockerode';

/**
 * Lazy Docker client — only created on first use.
 * On cloud PaaS environments (Render, Railway, Vercel) without a Docker daemon
 * this returns null instead of crashing the server at boot.
 */
let _docker: Docker | null = null;

export const getDockerClient = (): Docker => {
  if (!_docker) {
    try {
      _docker = new Docker();
    } catch (err: any) {
      throw new Error(
        `Docker daemon is not available on this host. Sandbox features require a Docker-enabled environment. (${err.message})`
      );
    }
  }
  return _docker;
};

// Keep backward-compat default export as a lazy proxy
export default {
  createContainer: (...args: Parameters<Docker['createContainer']>) =>
    getDockerClient().createContainer(...args),
  getContainer: (...args: Parameters<Docker['getContainer']>) =>
    getDockerClient().getContainer(...args),
};
