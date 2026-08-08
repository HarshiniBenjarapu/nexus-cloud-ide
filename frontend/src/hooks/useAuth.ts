import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials, logout as logoutAction } from '../store/authSlice';
import { clearWorkspaceSelection } from '../store/workspaceSlice';
import {
  loginUser,
  registerUser,
  logoutUser,
  LoginPayload,
  RegisterPayload,
} from '../services/auth.service';

export const useLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess: ({ token, user }) => {
      dispatch(setCredentials({ token, user }));
      navigate('/dashboard', { replace: true });
    },
  });
};

export const useRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload),
    onSuccess: ({ token, user }) => {
      dispatch(setCredentials({ token, user }));
      navigate('/dashboard', { replace: true });
    },
  });
};

export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    // Server-side logout is advisory with stateless JWTs, so local teardown
    // happens regardless of whether the call succeeds.
    logoutUser().catch(() => undefined);
    dispatch(logoutAction());
    dispatch(clearWorkspaceSelection());
    queryClient.clear();
    navigate('/login', { replace: true });
  };
};
