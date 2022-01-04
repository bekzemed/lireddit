import DataLoader from 'dataloader';
import { User } from '../entities/User';

// keys ---> Array like [1, 2, 4, 6]
// it returns ---> an Array of Object [{id: 1, username: 'bek'}, {}, {}, {}]
export const createUserLoader = () =>
  new DataLoader<number, User>(async userIds => {
    const users = await User.findByIds(userIds as number[]);
    // map , record type
    const usersIdToUser: Record<number, User> = {};
    users.forEach(u => {
      usersIdToUser[u._id] = u;
    });

    return userIds.map(userId => usersIdToUser[userId]);
  });
