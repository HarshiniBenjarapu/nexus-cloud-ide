import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { collaborationService, Collaborator } from '../../services/collaboration.service';
import { InviteMemberDialog } from '../workspace/InviteMemberDialog';
import { Users, UserPlus } from 'lucide-react';

export const CollaboratorsPresence: React.FC = () => {
  const { activeProjectId } = useSelector((state: RootState) => state.project);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    const fetchPresence = async () => {
      try {
        const list = await collaborationService.getWorkspacePresence('ws-default');
        setCollaborators(list);
      } catch (err) {
        // Fallback
      }
    };
    fetchPresence();
  }, [activeProjectId]);

  return (
    <div className="flex items-center space-x-2 select-none">
      {/* Avatars Stack */}
      <div className="flex items-center -space-x-2 overflow-hidden">
        {collaborators.map((c, idx) => (
          <div
            key={c.id || idx}
            className="relative inline-block w-7 h-7 rounded-full ring-2 ring-[#171A1F] bg-[#C58A42] text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-md cursor-pointer hover:z-10 transition-transform hover:scale-110"
            title={`${c.name} (${c.role}) - Active: ${c.activeFile || 'Workspace'}`}
          >
            {c.name.slice(0, 2)}
            <span
              className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-[#171A1F] ${
                c.status === 'online' ? 'bg-[#4CAF50]' : 'bg-[#F2B94B]'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Invite Button */}
      <button
        onClick={() => setIsInviteOpen(true)}
        className="flex items-center space-x-1 px-2.5 py-1 bg-[#20242B] hover:bg-white/10 text-xs text-white rounded-xl border border-white/10 transition-colors"
        title="Invite team collaborator"
      >
        <UserPlus className="w-3.5 h-3.5 text-[#C58A42]" />
        <span className="hidden sm:inline">Invite</span>
      </button>

      <InviteMemberDialog isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </div>
  );
};
