# Mobile ByteBank

Aplicativo mobile de gerenciamento financeiro desenvolvido com React Native, Expo SDK 57, TypeScript e Firebase. O usuário pode cadastrar, editar, excluir e consultar transações de receitas e despesas.

## Requisitos

- Node.js 22.13 ou superior, conforme o Expo SDK 57.
- npm.
- Android Studio e um emulador Android, ou um dispositivo físico com Expo Go/development build.
- Conta e projeto no Firebase.

## Tecnologias e dependências

- React Native 0.86.2.
- Expo `^57.0.19` e Expo Router `~57.0.14`.
- React 19.2.3.
- TypeScript 6.
- Firebase Authentication e Cloud Firestore.
- React Context API para autenticação e transações.
- `react-native-gifted-charts` para o gráfico financeiro.
- `Animated` do React Native e Reanimated para animações.
- `expo-image-picker` e `expo-document-picker` para seleção de comprovantes.
- `expo-auth-session` e `expo-crypto` para autenticação OAuth do Google no mobile.

As versões completas estão em [package.json](package.json).

## Instalação

Clone o repositório e entre na pasta do projeto:

```bash
git clone https://github.com/codedbytati/mobile-tutu-app.git
cd mobile-bytebank
```

Instale as dependências:

```bash
npm install
```

## Configuração do Firebase

### 1. Criar o projeto

1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Crie um projeto ou selecione um projeto existente.
3. Adicione um aplicativo Web ao projeto.
4. Copie as credenciais exibidas em **Configurações do projeto > Seus apps > Configuração do SDK**.

### 2. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto a partir do exemplo:

```bash
copy .env.example .env
```

No macOS/Linux, use:

```bash
cp .env.example .env
```

Preencha o arquivo `.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=sua_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=seu_app_id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=seu_client_id_web.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=seu_client_id_android.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=seu_client_id_ios.apps.googleusercontent.com
```

O arquivo `.env` não deve ser commitado. O código valida a presença dessas variáveis ao inicializar o Firebase em [firebaseConfig.ts](src/services/firebase/firebaseConfig.ts).

### 3. Ativar autenticação

No Firebase Console, abra **Authentication > Sign-in method**, ative **E-mail/senha** e salve.

Também ative o provedor **Google** e salve. Para o login mobile, crie os clientes OAuth no Google Cloud Console para Web, Android e iOS. Use o Client ID de cada plataforma nas variáveis correspondentes do `.env`.

O projeto já possui o scheme `mobilebytebank` no [app.json](app.json), necessário para o retorno do login OAuth em builds Android/iOS. Depois de alterar o `.env`, reinicie o Expo com `npx expo start -c`.

O aplicativo usa Firebase Authentication para:

- Cadastro de usuário com nome, e-mail e senha.
- Login e logout.
- Login com conta Google.
- Identificação do usuário autenticado.

### 4. Criar o Firestore

No Firebase Console, abra **Firestore Database** e crie o banco de dados.

Cada documento da coleção `transactions` possui, entre outros, os campos:

```text
userId
description
searchDescription
amount
type       // income ou expense
category
date
createdAt
receiptDataUrl (opcional)
receiptFileName (opcional)
```

As transações são consultadas pelo `userId` do usuário autenticado. Configure regras de segurança para impedir que um usuário leia ou altere transações de outro usuário. Um exemplo inicial para a coleção é:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{transactionId} {
      allow read: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }
  }
}
```

Revise e teste as regras no Firebase Console antes de publicar em produção.

## Recibos e documentos

O projeto permite selecionar imagens, PDFs e arquivos de texto. Como o Firebase Storage não é utilizado neste projeto, o comprovante é convertido para Data URL e salvo no próprio documento do Firestore.

Por isso, o formulário limita o arquivo a **450 KB**, mantendo margem para o limite de tamanho de documentos do Firestore. O Firebase Storage pode ser adotado futuramente caso seja necessário suportar arquivos maiores.

## Executar localmente

Inicie o servidor Expo:

```bash
npm run start
```

Depois escolha uma opção no terminal do Expo:

- `a`: abrir no Android.
- `w`: abrir no navegador.
- `i`: abrir no simulador iOS, quando disponível.

Também existem comandos específicos:

```bash
npm run android
npm run ios
npm run web
```

Se alterar o `.env` ou tiver problemas com o cache do Metro, reinicie com:

```bash
npx expo start -c
```

## Funcionalidades

### Dashboard

- Exibe saldo total, receitas e despesas.
- Exibe gráfico de receitas e despesas dos últimos seis meses.
- Busca o histórico de transações do usuário autenticado.
- Usa animação `Animated` na entrada do conteúdo.

### Transações

- Lista transações agrupadas por data.
- Permite filtrar por `Todos`, `Receita` e `Despesa`.
- Permite pesquisar pela descrição.
- Permite filtrar por data inicial e final no formato `DD/MM/AAAA`.
- Possui paginação com cursor do Firestore e carregamento ao rolar.
- Permite tocar em uma transação para editar.
- Permite excluir uma transação diretamente na tela de edição.

### Cadastro e edição

- Permite cadastrar receitas e despesas.
- Permite editar transações existentes.
- O formulário de cadastro abre vazio.
- O formulário de edição carrega os dados da transação selecionada.
- Valida descrição, valor, data, tipo, categoria e formato do comprovante.
- Permite anexar imagem, PDF ou arquivo de texto.

## Estado e organização

O estado global é gerenciado pela Context API:

- `AuthContext`: sessão, login, cadastro e logout.
- `TransactionContext`: transações, filtros, paginação, carregamento, criação, edição e exclusão.

Principais diretórios:

```text
src/
  app/                  Telas e rotas Expo Router
  components/           Componentes reutilizáveis
  constants/            Cores e espaçamentos
  contexts/             Contextos de autenticação e transações
  services/firebase/    Configuração do Firebase
  types/                Tipos do domínio de transações
```

## Validação do projeto

Verificar tipos TypeScript:

```bash
npx tsc --noEmit
```

Executar o lint:

```bash
npm run lint
```

## Observações

- O projeto é direcionado a dispositivos móveis, mas possui suporte web pelo Expo.
- A busca por descrição usa o campo `searchDescription` no Firestore e é restrita ao usuário autenticado. O Firebase pode solicitar um índice composto para essa consulta.
- O filtro de categoria existe no modelo de dados e no formulário, mas não é exibido como filtro na tela de listagem.
- Nunca publique o conteúdo do `.env` em um repositório Git.
