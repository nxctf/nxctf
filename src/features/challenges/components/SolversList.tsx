// React Imports
import React from 'react';

// Shared Imports
import { formatRelativeDate } from '@/shared/lib'

// Local Imports
import type { Solver } from '../types'

interface SolversListProps {
  solvers: Solver[];
}

const SolversList: React.FC<SolversListProps> = ({ solvers }) => {
  // Find the earliest solve time to identify First Blood correctly regardless of sort order
  const firstBloodTime = React.useMemo(() => {
    if (solvers.length === 0) return null;
    return Math.min(...solvers.map(s => new Date(s.solvedAt).getTime()));
  }, [solvers]);

  return (
    <ul className="space-y-3">
      {solvers.length === 0 ? (
        <li className="text-gray-400 dark:text-gray-500">No solves yet.</li>
      ) : (
        solvers.map((solver, idx) => {
          const isFirstBlood = firstBloodTime && new Date(solver.solvedAt).getTime() === firstBloodTime;

          return (
            <li key={idx} className="flex justify-between items-center text-gray-700 dark:text-gray-200 text-sm md:text-base">
              <div className="flex items-center gap-2">
                {isFirstBlood && (
                  <span title="First Blood" className="text-red-500 dark:text-red-400 text-lg font-bold">🩸</span>
                )}
                <a
                  href={`/user/${encodeURIComponent(solver.username)}`}
                  className={`hover:underline ${isFirstBlood ? 'font-bold text-red-500 dark:text-red-400' : 'text-pink-600 dark:text-pink-300'} max-w-[180px] md:max-w-60 truncate block`}
                  style={{ maxWidth: '240px' }}
                  title={solver.username}
                >
                  {solver.username}
                </a>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-300">{formatRelativeDate(solver.solvedAt)}</span>
            </li>
          );
        })
      )}
    </ul>
  );
};

export default SolversList;
