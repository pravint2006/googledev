import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  onSnapshot,
  GeoPoint,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { Farm, GateValve } from '../data';

const { firestore: db } = initializeFirebase();

const FARMS_COLLECTION = 'farms';

export async function addFarm(
  userId: string,
  farmData: Omit<Farm, 'id' | 'ownerId'>
) {
  const gateValves = farmData.gateValves.map((valve) => {
    if ('lat' in valve.position && 'lng' in valve.position) {
      return {
        ...valve,
        position: new GeoPoint(valve.position.lat, valve.position.lng),
      };
    }
    return valve;
  });

  await addDoc(collection(db, FARMS_COLLECTION), {
    ...farmData,
    gateValves,
    ownerId: userId,
  });
}

export function getFarms(
  userId: string,
  callback: (farms: Farm[]) => void
): () => void {
  const q = query(collection(db, FARMS_COLLECTION), where('ownerId', '==', userId));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const farms: Farm[] = [];
    querySnapshot.forEach((doc) => {
      farms.push({ id: doc.id, ...doc.data() } as Farm);
    });
    callback(farms);
  });

  return unsubscribe;
}

export async function deleteFarm(farmId: string) {
  await deleteDoc(doc(db, FARMS_COLLECTION, farmId));
}

export async function toggleValveStatus(farmId: string, valveId: string) {
  const farmRef = doc(db, FARMS_COLLECTION, farmId);
  const batch = writeBatch(db);

  const farmDoc = await getDoc(farmRef);
  if (farmDoc.exists()) {
    const farm = farmDoc.data() as Farm;
    const valveToUpdate = farm.gateValves.find(v => v.id === valveId);
    if (valveToUpdate) {
        const newStatus = valveToUpdate.status === 'open' ? 'closed' : 'open';
        const updatedValve = {...valveToUpdate, status: newStatus};

        batch.update(farmRef, { gateValves: arrayRemove(valveToUpdate) });
        batch.update(farmRef, { gateValves: arrayUnion(updatedValve) });
        await batch.commit();
    }
  }
}

export async function closeAllValves(farmId: string) {
    const farmRef = doc(db, FARMS_COLLECTION, farmId);
    const farmDoc = await getDoc(farmRef);

    if (farmDoc.exists()) {
        const farm = farmDoc.data() as Farm;
        const batch = writeBatch(db);

        const updatedValves = farm.gateValves.map(valve => ({
            ...valve,
            status: 'closed'
        }));

        batch.update(farmRef, { gateValves: updatedValves });
        await batch.commit();
    }
}
