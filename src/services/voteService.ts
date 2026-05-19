import { 
  collection, 
  addDoc,
  getDocs, 
  serverTimestamp,
  query,
  limit,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Player } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isTimeout = error instanceof Error && (error.message.includes("timeout") || error.message.includes("deadline"));
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  
  if (isTimeout) {
    console.warn('Firestore Timeout (handled):', path);
    return; // Don't throw for timeouts
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface VoteData {
  lineup: Record<string, string>; // slotId -> playerId
  coachId: string;
  voterIp?: string;
  voterName?: string;
  createdAt?: any;
}

export const getUserIp = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (e) {
    console.error("Failed to fetch IP", e);
    return "unknown";
  }
};

export const hasAlreadyVoted = async (ip: string): Promise<boolean> => {
  if (ip === "unknown") return false;
  
  try {
    const q = query(
      collection(db, 'votes'), 
      where('voterIp', '==', ip),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (e) {
    console.error("Error checking vote status", e);
    return false;
  }
};

export const submitVote = async (lineup: Record<string, Player | null>, coach: Player, ip?: string) => {
  const path = 'votes';
  const lineupData: Record<string, string> = {};
  Object.entries(lineup).forEach(([slotId, player]) => {
    if (player) lineupData[slotId] = player.id;
  });

  const vote: VoteData = {
    lineup: lineupData,
    coachId: coach.id,
    voterIp: ip,
    voterName: "Anonym",
    createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
  };

  // Always save to local storage as fallback/cache
  try {
    const localVotes = JSON.parse(localStorage.getItem('local_votes') || '[]');
    localStorage.setItem('local_votes', JSON.stringify([...localVotes, vote]));
  } catch (e) {
    console.error("Local storage failed", e);
  }

  try {
    // Add a race with a timeout promise to prevent indefinite hanging during submission
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Firestore submission timeout")), 3000)
    );

    await Promise.race([
      addDoc(collection(db, 'votes'), { ...vote, createdAt: serverTimestamp() }),
      timeoutPromise
    ]);
  } catch (error) {
    // We already saved locally, so we can fail silently for the backend
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getVotes = async () => {
  const path = 'votes';
  let firestoreVotes: VoteData[] = [];

  try {
    const q = query(collection(db, 'votes'), limit(1000));
    
    // Add a race with a timeout promise to prevent indefinite hanging
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Firestore timeout")), 2500)
    );

    const querySnapshot = await Promise.race([
      getDocs(q),
      timeoutPromise
    ]) as any;

    firestoreVotes = querySnapshot.docs.map((doc: any) => doc.data() as VoteData);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }

  // Merge with local votes to ensure user's own votes are always visible
  try {
    const localVotes = JSON.parse(localStorage.getItem('local_votes') || '[]');
    // Simple de-duplication could go here if needed
    return [...firestoreVotes, ...localVotes];
  } catch (e) {
    return firestoreVotes;
  }
};

export const calculateCommunityStats = (votes: VoteData[]) => {
  const playerCounts: Record<string, number> = {};
  const coachCounts: Record<string, number> = {};
  const rotationCounts: Record<string, number> = {}; // Not used yet but could be

  votes.forEach(vote => {
    Object.values(vote.lineup).forEach(playerId => {
      playerCounts[playerId] = (playerCounts[playerId] || 0) + 1;
    });
    coachCounts[vote.coachId] = (coachCounts[vote.coachId] || 0) + 1;
  });

  return { playerCounts, coachCounts };
};
