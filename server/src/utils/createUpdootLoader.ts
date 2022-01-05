import DataLoader from 'dataloader';
import { Updoot } from '../entities/Updoot';

// keys --->  [{postId: 1, userId: 2}]
// it returns ---> [{postId: 1, userId: 2, value: 2}]

export const createUpdootLoader = () =>
  // 1. create loader
  new DataLoader<{ postId: number; userId: number }, Updoot | null>(
    async keys => {
      // 2. define how to batch all of the call in a single sql statement
      const updoots = await Updoot.find(keys as any);

      // map , record type
      const updootsIdToUpdoot: Record<string, Updoot> = {};

      updoots.forEach(updoot => {
        // we can make postId and userId as a key by making them string
        updootsIdToUpdoot[`${updoot.userId}|${updoot.postId}`] = updoot;
      });

      // 3. return data and pass to context
      return keys.map(key => updootsIdToUpdoot[`${key.userId}|${key.postId}`]);
    }
  );
