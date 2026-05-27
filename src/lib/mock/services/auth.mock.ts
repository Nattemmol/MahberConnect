import { delay, randomError } from '../utils';
import { mockUsers } from '../data/users';

export const authMock = {
  login: async (phone: string, password: string) => {
    await delay(800);
    randomError(0.1); // 10% chance to fail
    
    // Accept the mock user or any validly formatted phone for testing
    if (password.length >= 8) {
      return {
        access_token: 'mock_jwt_token_here',
        user: mockUsers[0],
      };
    }
    
    throw new Error('Invalid credentials');
  },
  
  register: async (phone: string, password: string, name: string) => {
    await delay(1000);
    randomError(0.1);
    
    const newUser = {
      id: `usr_${Math.random().toString(36).substring(7)}`,
      phone,
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    return newUser;
  },

  getProfile: async () => {
    await delay(500);
    return mockUsers[0];
  },

  forgotPassword: async (phone: string) => {
    await delay(800);
    randomError(0.1);
    return { message: 'If the account exists, a reset code has been sent.' };
  },

  resetPassword: async (phone: string, code: string, newPassword: string) => {
    await delay(800);
    randomError(0.1);
    if (code.length !== 6) throw new Error('Invalid or expired reset code');
    return { message: 'Password reset successfully.' };
  },

  searchUserByPhone: async (phone: string) => {
    await delay(600);
    const user = mockUsers.find(u => u.phone === phone);
    if (!user) throw new Error('User not found');
    return user;
  }
};
