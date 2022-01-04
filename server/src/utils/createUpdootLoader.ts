import DataLoader from 'dataloader';
import { Updoot } from '../entities/Updoot';

// keys --->  [{postId: 1, userId: 2}]
// it returns ---> [{postId: 1, userId: 2, value: 2}]

export const createUpdootLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Updoot | null>(
    async keys => {
      const updoots = await Updoot.findByIds(keys as any);

      // map , record type
      const updootsIdToUpdoot: Record<string, Updoot> = {};

      updoots.forEach(updoot => {
        // we can make postId and userId as a key by making them string
        updootsIdToUpdoot[`${updoot.userId}|${updoot.postId}`] = updoot;
      });

      return keys.map(key => updootsIdToUpdoot[`${key.userId}|${key.postId}`]);
    }
  );
