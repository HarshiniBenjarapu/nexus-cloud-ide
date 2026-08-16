import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../app/store';
import { setActiveProjectId } from '../store/projectSlice';
import { showToast } from '../store/uiSlice';
import { useOrganizations } from '../hooks/useOrganizations';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useCanAdminister } from '../hooks/useCanAdminister';
import { useProjects, useUpdateProject } from '../hooks/useProjects';
import { useProjectPermissions } from '../hooks/useProjectPermissions';
import { getApiErrorMessage } from '../lib/apiClient';
import { CreateWorkspaceDialog } from '../components/workspace/CreateWorkspaceDialog';
import { CreateProjectDialog } from '../components/project/CreateProjectDialog';
import { RenameProjectDialog } from '../components/project/RenameProjectDialog';
import { DeleteProjectDialog } from '../components/project/DeleteProjectDialog';
import { ProjectCardMenu } from '../components/project/ProjectCardMenu';
import { Project } from '../types';
import { Cloud, Plus, Star, Folder, GitBranch, Play, Layers, Terminal, HardDrive, Search, Loader2, Archive } from 'lucide-react';

type ProjectFilter = 'all' | 'favorites' | 'archived';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { activeProjectId } = useSelector((state: RootState) => state.project);
  const { activeOrg } = useOrganizations();
  const { workspaces, activeWorkspace } = useWorkspaces(activeOrg?._id);
  const { canAdminister } = useCanAdminister();
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [search, setSearch] = useState('');
  const [isCreateWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [isCreateProjectOpen, setCreateProjectOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const workspaceId = activeWorkspace?._id ?? null;

  // Filtering happens server-side so the list matches what the API authorizes
  const {
    projects,
    memberRole,
    isLoading: isLoadingProjects,
    isError: isProjectsError,
    error: projectsError,
  } = useProjects(workspaceId, {
    search: search.trim() || undefined,
    favorite: filter === 'favorites' ? true : undefined,
    // The API matches isArchived exactly, so this returns only archived
    // projects — and every other view already excludes them by default.
    archived: filter === 'archived' ? true : undefined,
  });

  const { canContribute } = useProjectPermissions(memberRole);
  const updateProject = useUpdateProject(workspaceId);

  // Only Owners and Admins may create workspaces (SRS 2.7)
  const canCreateWorkspace =
    activeOrg?.memberRole === 'Owner' || activeOrg?.memberRole === 'Admin';

  const handleLaunchProject = (project: Project) => {
    dispatch(setActiveProjectId(project._id));
    dispatch(showToast({ message: `Opening ${project.name} in Nexus Cloud IDE...`, type: 'info' }));
    navigate(`/ide/${project._id}`);
  };

  const handleToggleFavorite = async (event: React.MouseEvent, project: Project) => {
    // The card itself opens the IDE — the star must not trigger that
    event.stopPropagation();
    try {
      await updateProject.mutateAsync({
        projectId: project._id,
        payload: { isFavorite: !project.isFavorite },
      });
    } catch (error) {
      dispatch(showToast({ message: getApiErrorMessage(error), type: 'error' }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col font-sans select-none">
      {/* Top Navbar */}
      <header className="h-16 bg-[#171A1F] border-b border-white/10 px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-[#C58A42] to-[#D69A4E] rounded-xl text-white shadow-lg shadow-[#C58A42]/20">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">Nexus Cloud IDE Dashboard</h1>
            <p className="text-[11px] text-[#9DA5B4]">Organization: {activeOrg?.name || 'Personal Labs'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {canAdminister && (
            <button
              onClick={() => navigate('/admin')}
              className="px-3.5 py-1.5 bg-[#20242B] hover:bg-white/10 text-xs font-medium text-white border border-white/10 rounded-xl transition-all"
            >
              Admin Dashboard
            </button>
          )}

          {/* Only shown when there is a project to reopen — the IDE needs one */}
          {activeProjectId && (
            <button
              onClick={() => navigate(`/ide/${activeProjectId}`)}
              className="px-4 py-2 bg-[#C58A42] hover:bg-[#D69A4E] text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-[#C58A42]/20 flex items-center space-x-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume last project</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="p-6 bg-gradient-to-r from-[#171A1F] to-[#20242B] border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Welcome back, {user?.fullName || 'Developer'}! 👋</h2>
            <p className="text-xs text-[#9DA5B4]">
              You have {projects.length} active projects across {workspaces.length} workspaces.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {canCreateWorkspace && (
              <button
                onClick={() => setCreateWorkspaceOpen(true)}
                className="px-4 py-2.5 bg-[#20242B] hover:bg-white/10 text-white text-xs font-medium rounded-xl flex items-center space-x-2 transition-all border border-white/10"
              >
                <Layers className="w-4 h-4" />
                <span>New Workspace</span>
              </button>
            )}
            {canContribute && (
              <button
                onClick={() => setCreateProjectOpen(true)}
                disabled={!workspaceId}
                className="px-4 py-2.5 bg-[#C58A42] hover:bg-[#D69A4E] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-[#C58A42]/20"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>

        {/* System Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-[#C58A42]/15 text-[#C58A42] rounded-xl border border-[#C58A42]/30">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{projects.length}</div>
              <div className="text-xs text-[#9DA5B4]">Total Projects</div>
            </div>
          </div>

          <div className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-[#4D8DFF]/15 text-[#4D8DFF] rounded-xl border border-[#4D8DFF]/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{workspaces.length}</div>
              <div className="text-xs text-[#9DA5B4]">Workspaces</div>
            </div>
          </div>

          <div className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-[#4CAF50]/15 text-[#4CAF50] rounded-xl border border-[#4CAF50]/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Active</div>
              <div className="text-xs text-[#9DA5B4]">Shared Terminal</div>
            </div>
          </div>

          <div className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-[#F2B94B]/15 text-[#F2B94B] rounded-xl border border-[#F2B94B]/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">1.2 GB / 10 GB</div>
              <div className="text-xs text-[#9DA5B4]">Cloud Storage Used</div>
            </div>
          </div>
        </div>

        {/* Workspaces Section — live data from the API */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white">Workspaces</h3>
            <span className="text-[11px] text-[#9DA5B4]">
              {activeOrg ? activeOrg.name : 'No organization selected'}
            </span>
          </div>

          {workspaces.length === 0 ? (
            <div className="p-8 bg-[#171A1F] border border-dashed border-white/10 rounded-2xl text-center space-y-2">
              <Layers className="w-6 h-6 text-[#9DA5B4]/50 mx-auto" />
              <p className="text-xs text-[#9DA5B4]">
                No workspaces yet in this organization.
              </p>
              {canCreateWorkspace && (
                <button
                  onClick={() => setCreateWorkspaceOpen(true)}
                  className="text-xs text-[#C58A42] font-semibold hover:underline"
                >
                  Create your first workspace
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((ws) => (
                <div
                  key={ws._id}
                  className="p-4 bg-[#171A1F] border border-white/10 rounded-2xl space-y-2 hover:border-[#4D8DFF]/40 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[#4D8DFF]/10 border border-[#4D8DFF]/30 rounded-xl text-[#4D8DFF]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white truncate">{ws.name}</h4>
                  </div>
                  {ws.description && (
                    <p className="text-xs text-[#9DA5B4] line-clamp-2 leading-relaxed">{ws.description}</p>
                  )}
                  <div className="pt-2 border-t border-white/5 text-[11px] text-[#9DA5B4]">
                    Created {new Date(ws.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects Section — live data from the API */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white">Projects</h3>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#9DA5B4] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search projects"
                  aria-label="Search projects"
                  className="pl-8 pr-3 py-1.5 w-48 bg-[#171A1F] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42]/60 transition-all"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    filter === 'all' ? 'bg-[#C58A42] text-white font-medium' : 'text-[#9DA5B4] hover:text-white'
                  }`}
                >
                  All Projects
                </button>
                <button
                  onClick={() => setFilter('favorites')}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    filter === 'favorites' ? 'bg-[#C58A42] text-white font-medium' : 'text-[#9DA5B4] hover:text-white'
                  }`}
                >
                  Favorites
                </button>
                <button
                  onClick={() => setFilter('archived')}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    filter === 'archived' ? 'bg-[#C58A42] text-white font-medium' : 'text-[#9DA5B4] hover:text-white'
                  }`}
                >
                  Archived
                </button>
              </div>
            </div>
          </div>

          {!workspaceId ? (
            <div className="p-8 bg-[#171A1F] border border-dashed border-white/10 rounded-2xl text-center space-y-2">
              <Folder className="w-6 h-6 text-[#9DA5B4]/50 mx-auto" />
              <p className="text-xs text-[#9DA5B4]">
                Create a workspace first — projects live inside one.
              </p>
            </div>
          ) : isLoadingProjects ? (
            <div className="p-8 flex items-center justify-center text-[#9DA5B4]">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : isProjectsError ? (
            <div className="p-8 bg-[#171A1F] border border-dashed border-[#E65A5A]/40 rounded-2xl text-center">
              <p className="text-xs text-[#E65A5A]">{getApiErrorMessage(projectsError)}</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 bg-[#171A1F] border border-dashed border-white/10 rounded-2xl text-center space-y-2">
              <Folder className="w-6 h-6 text-[#9DA5B4]/50 mx-auto" />
              <p className="text-xs text-[#9DA5B4]">
                {search.trim()
                  ? `No projects match "${search.trim()}".`
                  : filter === 'favorites'
                    ? 'No favorite projects yet.'
                    : filter === 'archived'
                      ? 'No archived projects.'
                      : 'No projects yet in this workspace.'}
              </p>
              {canContribute && !search.trim() && filter === 'all' && (
                <button
                  onClick={() => setCreateProjectOpen(true)}
                  className="text-xs text-[#C58A42] font-semibold hover:underline"
                >
                  Create your first project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div
                  key={proj._id}
                  onClick={() => handleLaunchProject(proj)}
                  className="p-5 bg-[#171A1F] hover:bg-[#20242B] border border-white/10 rounded-2xl space-y-4 cursor-pointer transition-all hover:border-[#C58A42]/50 group shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-[#C58A42]/10 border border-[#C58A42]/30 rounded-xl text-[#C58A42] group-hover:scale-105 transition-transform">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#C58A42] transition-colors">{proj.name}</h4>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#9DA5B4]">{proj.template}</span>
                          {proj.isArchived && (
                            <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-[#F2B94B]/10 text-[#F2B94B] border border-[#F2B94B]/25">
                              <Archive className="w-2.5 h-2.5" />
                              <span>Archived</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-0.5">
                      <button
                        onClick={(event) => handleToggleFavorite(event, proj)}
                        disabled={!canContribute}
                        aria-label={proj.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        className="p-1 rounded-lg hover:bg-white/10 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
                      >
                        <Star className={`w-4 h-4 ${proj.isFavorite ? 'text-[#F2B94B] fill-current' : 'text-[#9DA5B4]/30'}`} />
                      </button>

                      {workspaceId && (
                        <ProjectCardMenu
                          project={proj}
                          workspaceId={workspaceId}
                          memberRole={memberRole}
                          onRename={setProjectToRename}
                          onDelete={setProjectToDelete}
                        />
                      )}
                    </div>
                  </div>

                  {proj.description && (
                    <p className="text-xs text-[#9DA5B4] line-clamp-2 leading-relaxed">{proj.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-[#9DA5B4]">
                    <div className="flex items-center space-x-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-[#4CAF50]" />
                      <span>{proj.language || proj.template}</span>
                    </div>
                    <span>Updated {new Date(proj.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {activeOrg && (
        <CreateWorkspaceDialog
          orgId={activeOrg._id}
          isOpen={isCreateWorkspaceOpen}
          onClose={() => setCreateWorkspaceOpen(false)}
        />
      )}

      {workspaceId && (
        <>
          <CreateProjectDialog
            workspaceId={workspaceId}
            isOpen={isCreateProjectOpen}
            onClose={() => setCreateProjectOpen(false)}
          />

          <RenameProjectDialog
            workspaceId={workspaceId}
            project={projectToRename}
            onClose={() => setProjectToRename(null)}
          />

          <DeleteProjectDialog
            workspaceId={workspaceId}
            project={projectToDelete}
            onClose={() => setProjectToDelete(null)}
            // Deleting the project that's open in the IDE would leave stale
            // tabs behind; clearing selection also closes them.
            onDeleted={(deletedId) => {
              if (activeProjectId === deletedId) dispatch(setActiveProjectId(null));
            }}
          />
        </>
      )}
    </div>
  );
};
