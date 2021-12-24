import { UsernameAndPasswordInputs } from 'src/resolvers/UsernameAndPasswordInputs';

export const validateRegister = (options: UsernameAndPasswordInputs) => {
  if (!options.email.includes('@')) {
    return [
      {
        field: 'email',
        message: 'invalid email address',
      },
    ];
  }

  if (options.username.length <= 2) {
    return [
      {
        field: 'username',
        message: 'length of username should be greater than 2',
      },
    ];
  }

  if (options.password.length <= 3) {
    return [
      {
        field: 'password',
        message: 'length of password should be greater than 3',
      },
    ];
  }
  if (options.username.includes('@')) {
    return [
      {
        field: 'username',
        message: 'can not include an @',
      },
    ];
  }

  return null;
};
