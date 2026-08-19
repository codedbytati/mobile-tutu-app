# Mobile ByteBank

Aplicativo mobile de gerenciamento financeiro para Expo SDK 57, React Native, TypeScript e Firebase.

## Arquitetura

```text
src/
   app/                 Rotas Expo Router: dashboard, transações e cadastro
   components/          Componentes de apresentação e navegação
   constants/           Tokens visuais
   contexts/             AuthContext e TransactionContext
   services/firebase/    Inicialização do Auth, Firestore e Storage
   types/                Contratos TypeScript do domínio
```

O estado global usa exclusivamente React Context API. `TransactionContext` filtra por usuário autenticado, busca por prefixo da descrição no Firestore, pagina com cursor, aplica filtros de data/tipo/categoria e armazena comprovantes pequenos como Data URL no próprio documento Firestore.

## Firebase

1. Copie `.env.example` para `.env` e preencha as credenciais do seu app Web Firebase. Elas ficam no Firebase Console em **Configurações do projeto > Seus apps > Web > Configuração do SDK**.
2. Ative Email/Password no Firebase Authentication.
3. Crie o Firestore.
4. Publique regras que exijam `request.auth.uid == resource.data.userId` para transações.
5. Caso o Firestore solicite, crie os índices compostos para `userId`, `searchDescription`, `type`/`category` e `date`.

### Comprovantes

Para manter o projeto sem custo de Storage, recibos são convertidos para Data URL e salvos no documento Firestore. O limite do formulário é de **450 KB por arquivo**, deixando margem para o limite de aproximadamente 1 MiB por documento do Firestore. Para arquivos maiores, use um link externo ou ative o Firebase Storage.

Se o cadastro retornar `CONFIGURATION_NOT_FOUND`, abra **Authentication > Sign-in method > E-mail/senha**, ative o provedor e salve. Confirme também em **Configurações do projeto > Geral** que o `projectId` e a `apiKey` usados no `.env` pertencem ao mesmo projeto. Em **Configurações do projeto > Integrações de serviço > Gerenciamento de API**, confirme que a Identity Toolkit API está habilitada.

Depois de criar ou alterar `.env`, reinicie o Metro para carregar as variáveis:

```bash
npx expo start -c
```

## Desenvolvimento

```bash
npm install
npx expo start
npx tsc --noEmit
```

O projeto segue as referências versionadas do [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
