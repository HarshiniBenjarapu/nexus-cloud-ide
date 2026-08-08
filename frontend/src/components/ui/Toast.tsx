import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { hideToast } from '../../store/uiSlice';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const dispatch = useDispatch();
  const toast = useSelector((state: RootState) => state.ui.toast);

  useEffect(() => {
    if (toast?.visible) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  if (!toast || !toast.visible) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-[#4CAF50]" />,
    error: <AlertCircle className="w-5 h-5 text-[#E65A5A]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#F2B94B]" />,
    info: <Info className="w-5 h-5 text-[#4D8DFF]" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 bg-[#20242B] border border-white/10 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in">
      {iconMap[toast.type]}
      <span className="text-sm font-medium text-white">{toast.message}</span>
      <button
        onClick={() => dispatch(hideToast())}
        className="p-1 text-[#9DA5B4] hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
