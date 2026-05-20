"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Mail, X } from 'lucide-react'

import ConfirmDialog from '@/shared/components/ConfirmDialog'
import { AuthService } from '../services/auth.service'

type AuthInfo = { provider: string; email: string };

export default function AuthProviders({ authInfo }: { authInfo: AuthInfo[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingUnbindEmail, setPendingUnbindEmail] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [localAuthInfo, setLocalAuthInfo] = useState<AuthInfo[]>(authInfo);
  const router = useRouter();

  if (!localAuthInfo || localAuthInfo.length === 0) return null;

  const sorted = [...localAuthInfo].sort((a, b) =>
    a.provider === "email" ? -1 : b.provider === "email" ? 1 : 0
  );

  const providers = sorted.map(p => p.provider);
  const canUnbind = providers.length > 1;
  const googleInfo = sorted.find(p => p.provider === 'google');

  const getIcon = (provider: string) => {
    switch (provider) {
      case "google":
        return <Globe size={14} />;
      case "email":
      default:
        return <Mail size={14} />;
    }
  };

  const getLabel = (provider: string) =>
    provider === "email" ? "Email" : provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <div className="mt-4 space-y-2">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
        Login methods
      </div>

      <div className="flex flex-row flex-nowrap gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 py-1">
        {sorted.map(item => {
          const isEmail = item.provider === "email";
          const removable = !isEmail && canUnbind;

          return (
            <div
              key={item.provider}
              className="flex flex-1 min-w-0 items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 shadow-sm transition-all"
              style={{ minHeight: 48 }}
            >
              <span className="text-gray-500 dark:text-gray-300">
                {getIcon(item.provider)}
              </span>

              <div className="flex flex-col leading-tight flex-1 min-w-0">
                <span className="font-semibold truncate">
                  {getLabel(item.provider)}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  {item.email}
                </span>
              </div>

              {removable && googleInfo && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPendingUnbindEmail(googleInfo.email);
                    setConfirmOpen(true);
                  }}
                  className="ml-1 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition"
                  title="Unbind Google"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}

        {!providers.includes("google") && (
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError("");
              const { error } = await AuthService.bindGoogle();
              setLoading(false);
              if (error) setError(error);
            }}
            className="flex flex-1 min-w-0 items-center gap-2 rounded-lg border border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 px-4 py-2 text-blue-700 dark:text-blue-200 font-semibold shadow-sm hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all"
            style={{ minHeight: 48 }}
          >
            <Globe size={16} />
            <span className="truncate flex-1 text-left">Google</span>
            <span className="text-xs font-bold">+</span>
          </button>
        )}
      </div>

      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="destructive"
        title="Unbind Google Account"
        description={
          <div>
            <div className="mb-2">Are you sure you want to unbind your Google account? This action cannot be undone.</div>
            {pendingUnbindEmail && (
              <>
                <div className="mt-2 p-3 rounded bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 text-sm font-semibold flex flex-col gap-1">
                  <span><b>Google Email:</b> <span className="font-mono">{pendingUnbindEmail}</span></span>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type <b>{pendingUnbindEmail}</b> to confirm:
                  </label>
                  <input
                    type="text"
                    className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'}
                    value={confirmInput}
                    onChange={e => setConfirmInput(e.target.value)}
                    autoFocus
                  />
                </div>
              </>
            )}
          </div>
        }
        confirmLabel="Unbind"
        onConfirm={async () => {
          setLoading(true);
          setError("");

          const { error } = await AuthService.unbindGoogle();

          setLoading(false);
          setConfirmOpen(false);
          setConfirmInput("");
          setPendingUnbindEmail("");

          if (error) {
            setError(error);
            return;
          }
          setLocalAuthInfo(prev => prev.filter(p => p.provider !== 'google'));
          router.refresh();
        }}
        confirmDisabled={confirmInput !== pendingUnbindEmail}
      />
    </div>
  );
}
