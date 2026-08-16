import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { collaborationService } from '../../services/collaboration.service';
import { UserPlus, Mail, Shield, Check, X, RefreshCw } from 'lucide-react';

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({ isOpen, onClose, workspaceId }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Owner' | 'Admin' | 'Member' | 'Viewer'>('Member');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSendInvite = async () => {
    if (!email.trim()) {
      dispatch(showToast({ message: 'Please enter a valid email address!', type: 'warning' }));
      return;
    }

    setIsSending(true);
    try {
      await collaborationService.inviteMember({ email, role, workspaceId });
      dispatch(
        showToast({
          message: `Workspace invitation sent to ${email} as ${role}!`,
          type: 'success',
        })
      );
      setEmail('');
      onClose();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Failed to send invitation', type: 'error' }));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#171A1F] border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#C58A42]/15 text-[#C58A42] rounded-xl border border-[#C58A42]/30">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Invite Team Collaborator</h3>
              <p className="text-[11px] text-[#9DA5B4]">Grant workspace access to real-time coding sessions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#9DA5B4] hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#9DA5B4]">Collaborator Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42]"
              />
              <Mail className="w-4 h-4 text-[#9DA5B4] absolute left-3 top-3" />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#9DA5B4]">Assigned Role & Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Admin', label: 'Admin', desc: 'Full edit & settings' },
                { id: 'Member', label: 'Member', desc: 'Read & edit workspace' },
                { id: 'Viewer', label: 'Viewer', desc: 'Read-only view' },
                { id: 'Owner', label: 'Co-Owner', desc: 'Billing & admin' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setRole(item.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-colors ${
                    role === item.id
                      ? 'bg-[#C58A42]/15 border-[#C58A42] text-white'
                      : 'bg-[#0F1115] border-white/5 text-[#9DA5B4] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{item.label}</span>
                    {role === item.id && <Check className="w-3 h-3 text-[#C58A42]" />}
                  </div>
                  <div className="text-[10px] text-[#9DA5B4] mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#20242B] hover:bg-white/10 text-white text-xs font-medium rounded-xl border border-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSendInvite}
            disabled={isSending}
            className="px-5 py-2 bg-[#C58A42] hover:bg-[#D69A4E] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-md shadow-[#C58A42]/20"
          >
            {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            <span>Send Invitation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
