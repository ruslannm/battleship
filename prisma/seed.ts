import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const salt = Number(process.env.PASSWORD_SALT);

type user = {
  id: number;
  role: string;
  username: string;
  password: string;
};

const dataUsers: user[] = [
  {
    id: 0,
    role: 'bot',
    username: 'bot',
    password: 'bot',
  },
  {
    id: 1,
    role: 'admin',
    username: 'Alice',
    password: bcrypt.hashSync('Alice', salt),
  },
  {
    id: 2,
    role: 'player',
    username: 'Bob',
    password: bcrypt.hashSync('Bob', salt),
  },
  {
    id: 3,
    role: 'player',
    username: 'John',
    password: bcrypt.hashSync('John', salt),
  },
];

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
    Promise.all(
      docks.map(async (item: dock) => {
        const { id, ...data } = item;
        await prisma.dock.upsert({
          where: { id },
          update: data,
          create: item,
        });
      }),
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
