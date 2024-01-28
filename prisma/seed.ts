import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { botUserId, stages } from '../src/constants';

const prisma = new PrismaClient();

const salt = Number(process.env.PASSWORD_SALT);
const amountUsers = 21;
const amountGames = 21;

type user = {
  id: number;
  role: string;
  username: string;
  password: string;
};

const dataUsers = [...Array(amountUsers - 1).keys()].map((i) => {
  return {
    id: i + 1,
    role: 'player',
    username: `player-${i + 1}`,
    password: bcrypt.hashSync(`player-${i + 1}`, salt),
  };
});

dataUsers.push({
  id: 0,
  role: 'bot',
  username: 'bot',
  password: 'bot',
});

type game = {
  userId: number;
  firstShooterId: number;
  winnerId: number;
};
const games: game[] = [];
for (let userId = 1; userId < amountUsers; userId++) {
  for (let i = 0; i < amountGames; i++) {
    const firstShooterId = Math.random() < 0.5 ? userId : botUserId;
    const winnerId = Math.random() < 0.5 ? userId : botUserId;
    games.push({
      userId,
      firstShooterId,
      winnerId,
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

Promise.all([
  ...dataUsers.map(async (item: user) => {
    const { id, ...data } = item;
    await prisma.user.upsert({
      where: { id },
      update: data,
      create: item,
    });
  }),
])
  .then(() => {
    Promise.all([
      ...docks.map(async (item: dock) => {
        const { id, ...data } = item;
        await prisma.dock.upsert({
          where: { id },
          update: data,
          create: item,
        });
      }),
    ]);
  })
  .then(async () => {
    await games.reduce(async (acc: Promise<void>, game) => {
      await acc;
      const { userId, firstShooterId, winnerId } = game;
      await prisma.game.create({
        data: {
          users: {
            create: [
              {
                user: { connect: { id: userId } },
                isFirstShooter: firstShooterId === userId,
              },
              {
                user: { connect: { id: botUserId } },
                isFirstShooter: firstShooterId === botUserId,
              },
            ],
          },
          winner: { connect: { id: winnerId } },
          stage: stages.at(-1),
        },
      });
    }, Promise.resolve());
  })
  // .then(async (res) => {
  //   res;
  // })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log(games.at(-1));
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
