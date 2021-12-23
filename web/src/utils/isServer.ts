// if a window is undefined we can say that it is running on the BROWSER(client)
// and if its active we can call it it running on the SERVER

export const isServer = () => typeof window === 'undefined';
