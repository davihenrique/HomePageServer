# HomePage
## Sobre o projeto
Esse projeto é uma página inicial com o objetivo de anexar links, sendo o ponto de partida de um homelab, anexando links por meio de um arquivo Json para fácil gerenciamento.

## Imagem do projeto
![Imagem do projeto](docs/homepage.png)

# Como executar localmente
1. Instalar o Angular CLI globalmente, caso ainda não tenha:
   ```bash
   npm install -g @angular/cli
   ```
2. Use  node versão 24

3. Instale o Angular CLI globalmente, caso ainda não tenha:
   ```bash
   npm install -g @angular/cli
   ```
4. Instale as dependências do projeto:
   ```bash
   npm install
   ```

5. Inicie o servidor de desenvolvimento:
   ```bash
   ng serve
   ```

# Como usar em um HomeLab
Execute a aplicação em um container Docker, utilizando a porta 80 para acesso, utilize Volume para o arquivo `links.json` para fácil gerenciamento dos links.
# Deploy automatico (Gitea Actions)

Todo push em `main` dispara [.gitea/workflows/deploy.yml](.gitea/workflows/deploy.yml):
o runner compila o Angular, envia `dist/HomePage/browser/` por `rsync` para o
servidor e sobe um nginx rootless na porta 80 via quadlet.

O servidor web faz parte do repositorio, em `deploy/`:

No servidor tudo fica sob `~/homepage/`:

```
~/homepage/
|-- site/        <- o build do Angular (substituido a cada deploy)
|-- data/
|   |-- links.json   <- seu, nunca sobrescrito
|   `-- icons/       <- pode vir do repositorio ou ser preenchido no servidor
`-- nginx.conf
```

Os icones ficam em `data/` e nao no site porque o container monta `data/` por
cima de `/usr/share/nginx/html/data`: o que chega apenas pelo build fica
invisivel debaixo desse mount.

A unica peca fora dessa pasta e o quadlet, porque o caminho e imposto pelo
systemd:

| Arquivo | Vai para o servidor em |
| --- | --- |
| `deploy/homepage.container` | `~/.config/containers/systemd/` |
| `deploy/nginx.conf` | `~/homepage/nginx.conf` |

## Estrutura do links.json

O arquivo tem tres grupos, um por secao da pagina, nesta ordem:

```json
{
  "servidor": [
    { "id": "3", "title": "Gitea", "port": "3000", "icon": "gitea" }
  ],
  "administracao": [
    { "id": "2", "title": "Cockpit", "port": "9090", "https": true,
      "icon": "cockpit" }
  ],
  "externos": [
    { "id": "e1", "title": "Tailscale",
      "url": "https://console.tailscale.com/admin/machines", "icon": "tailscale" }
  ]
}
```

Em `servidor` e `administracao` voce informa so a `port` (e `https: true` quando
o servico usa TLS): o host vem de onde a propria pagina esta aberta, entao os
links continuam validos pelo IP da Tailscale, pelo hostname local ou por
`localhost`.

Em `externos` voce informa a `url` completa, porque o destino nao esta no
servidor.

Uma secao vazia nao aparece na pagina. Os titulos ficam no template
(`home.component.html`), entao criar uma quarta secao exige mexer no codigo.

## Status dos servicos (Uptime Kuma)

Um servico que tenha monitor no Uptime Kuma ganha um indicador no card — ponto
colorido e uptime de 24h — bastando informar o id do monitor:

```json
{ "id": "1", "title": "Nextcloud", "port": "8090", "icon": "nextcloud",
  "monitor": "1" }
```

Os dados vem da status page de slug `home`, pelo endpoint
`/api/uptime/heartbeat/home`, que o nginx encaminha para o Kuma na porta 3001
(veja `deploy/nginx.conf`). O proxy existe porque uma chamada direta a outra
porta seria cross-origin e o navegador a bloquearia.

A pagina recarrega o estado a cada 30 segundos e tambem no momento em que a aba
volta a ficar visivel, sem precisar de F5. Se o Kuma estiver fora do ar, os cards
apenas perdem o indicador — nada mais quebra. Link sem `monitor` fica exatamente
como antes.

O quanto a deteccao demora nao depende so daqui: o Uptime Kuma tem o intervalo
de checagem de cada monitor (60s por padrao), entao uma queda aparece no card
depois que o proprio Kuma a registrar.

Para descobrir o id de um monitor, abra a status page e leia a resposta de
`http://100.93.9.20:3001/api/status-page/home`.

## Gerenciar os links sem rebuild

`links.json` e montado por fora do site. O deploy so o cria na primeira vez
(`--ignore-existing`) e nunca sobrescreve depois, entao basta editar no servidor:

```bash
nano ~/homepage/data/links.json
```

A mudanca vale no proximo carregamento da pagina, sem restart e sem deploy.
O arquivo em `public/data/links.json` continua servindo ao desenvolvimento local
e como valor inicial.

## Icones

Cada link aponta um icone pelo campo `icon`:

```json
{ "id": "5", "title": "Navidrome", "port": "4533", "icon": "navidrome" }
```

O valor e o nome de um arquivo em `public/data/icons/`, sem a extensao — os
SVGs vieram de [dashboard-icons](https://github.com/homarr-labs/dashboard-icons)
e estao versionados aqui para que a pagina nao dependa de um CDN externo.

Para um servico novo, ha dois caminhos:

- versionar o SVG em `public/data/icons/` e dar push;
- ou copiar o arquivo direto para `~/homepage/data/icons/` no servidor.

O deploy nao apaga o que esta no servidor e nem exige que a pasta do repositorio
exista — ela pode subir vazia e ser preenchida depois. Arquivos de mesmo nome sao
sobrescritos pelo que vem do repositorio.

Um valor comecando com `http` e usado como URL literal, caso voce prefira apontar
para fora. Nome inexistente nao quebra o layout: o card aparece so com o texto.

## Pre-requisitos no servidor (uma vez)

O container roda rootless, e rootless nao binda a porta 80 por padrao:

```bash
echo 'net.ipv4.ip_unprivileged_port_start=80' | sudo tee /etc/sysctl.d/99-unprivileged-ports.conf
sudo sysctl --system
```

Servicos `--user` precisam sobreviver ao logout:

```bash
sudo loginctl enable-linger davi
```

E a porta precisa estar aberta no firewalld:

```bash
sudo firewall-cmd --add-service=http --permanent && sudo firewall-cmd --reload
```

## Secrets do repositorio

- `DEPLOY_SSH_KEY_B64` — chave privada de deploy, em base64 (ou o PEM cru).
  A chave publica correspondente precisa estar em `~/.ssh/authorized_keys` do
  usuario `davi` no servidor.

## Diagnostico

```bash
systemctl --user status homepage.service
```

```bash
podman logs homepage
```
