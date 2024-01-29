import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { botUserId, stages, userRole } from '../src/constants';

const prisma = new PrismaClient();

const salt = Number(process.env.PASSWORD_SALT);
const amountUsers = 21;
const amountGames = 21;

type user = {
  id: number;
  role: string;
  username: string;
  password: string;
  refreshToken: string;
};

const users: user[] = [...Array(amountUsers - 1).keys()].map((i) => {
  return {
    id: i + 1,
    role: userRole,
    username: `player-${i + 1}`,
    password: bcrypt.hashSync(`player-${i + 1}`, salt),
    refreshToken: null,
  };
});

users.push({
  id: 0,
  role: 'bot',
  username: 'bot',
  password: 'bot',
  refreshToken: null,
});

type game = {
  id: number;
  stage: string;
  winnerId: number;
};
type usersInGame = {
  userId: number;
  gameId: number;
  isFirstShooter: boolean;
};

const games: game[] = [];
const usersInGames: usersInGame[] = [];
let gameId = 1;
for (let userId = 1; userId < amountUsers; userId++) {
  for (let i = 0; i < amountGames; i++, gameId++) {
    const winnerId = Math.random() < 0.5 ? userId : botUserId;
    games.push({
      id: gameId,
      stage: stages.at(-1),
      winnerId,
    });
    const firstShooterId = Math.random() < 0.5 ? userId : botUserId;
    usersInGames.push({
      userId,
      gameId,
      isFirstShooter: firstShooterId === userId,
    });
    usersInGames.push({
      userId: botUserId,
      gameId,
      isFirstShooter: firstShooterId === botUserId,
    });
  }
}

type dock = {
  id: number;
  shipLength: number;
  quantity: number;
};

const docks: dock[] = [
  {
    id: 1,
    shipLength: 4,
    quantity: 1,
  },
  {
    id: 2,
    shipLength: 3,
    quantity: 2,
  },
  {
    id: 3,
    shipLength: 2,
    quantity: 3,
  },
  {
    id: 4,
    shipLength: 1,
    quantity: 4,
  },
];

users
  .reduce(async (acc: Promise<user | void>, item) => {
    await acc;
    const { id, ...data } = item;
    return await prisma.user.upsert({
      where: { id },
      update: data,
      create: item,
    });
  }, Promise.resolve())
  .then(async () => {
    return await games.reduce(async (acc: Promise<game | void>, item: game) => {
      await acc;
      const { id, ...data } = item;
      return await prisma.game.upsert({
        where: { id },
        update: data,
        create: item,
      });
    }, Promise.resolve());
  })
  .then(async () => {
    return await usersInGames.reduce(
      async (acc: Promise<usersInGame | void>, item: usersInGame) => {
        await acc;
        return await prisma.usersInGames.upsert({
          where: {
            userId_gameId_isFirstShooter: item,
          },
          update: {},
          create: item,
        });
      },
      Promise.resolve(),
    );
  })
  .then(async () => {
    return await docks.reduce(async (acc: Promise<dock | void>, item: dock) => {
      await acc;
      const { id, ...data } = item;
      return await prisma.dock.upsert({
        where: { id },
        update: data,
        create: item,
      });
    }, Promise.resolve());
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
