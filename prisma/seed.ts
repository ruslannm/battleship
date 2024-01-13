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

type ship = {
  id: number;
  name: string;
  length: number;
};

const dataShips: ship[] = [
  {
    id: 1,
    name: 'линкор',
    length: 4,
  },
  {
    id: 2,
    name: 'крейсер',
    length: 3,
  },
  {
    id: 3,
    name: 'эсминец',
    length: 2,
  },
  {
    id: 4,
    name: 'катер',
    length: 1,
  },
];

type rule = {
  id: number;
  shipId: number;
  quantity: number;
};

const rules: rule[] = [
  {
    id: 1,
    shipId: 1,
    quantity: 1,
  },
  {
    id: 2,
    shipId: 2,
    quantity: 2,
  },
  {
    id: 3,
    shipId: 3,
    quantity: 3,
  },
  {
    id: 4,
    shipId: 4,
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
  ...dataShips.map(async (item: ship) => {
    const { id, ...data } = item;
    await prisma.ship.upsert({
      where: { id },
      update: data,
      create: item,
    });
  }),
])
  .then(() => {
    Promise.all(
      rules.map(async (item: rule) => {
        const { id, ...data } = item;
        await prisma.rule.upsert({
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
