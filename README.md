# Battleship

Игра Морской бой с использованием серверного рендеринга HBS.
Использованы технологии: веб-фрейморк NestJS, ORM Prisma, Bootstrap5

## Установка пакетов
```
npm i
```

## Подготовка базы данных

Создать базу данных, первоначальное наполнение базы данных производится автоматически (см seed.ts), так как в package.json в секции "prisma" есть свойство "seed".

```
npx prisma migrate dev --name init
```

## Старт приложения

```
npx nest start
```
