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

| Arquivo | Vai para o servidor em | Papel |
| --- | --- | --- |
| `deploy/homepage.container` | `~/.config/containers/systemd/` | unit systemd do container |
| `deploy/nginx.conf` | `~/homepage-nginx.conf` | fallback de rotas e cache |

O conteudo publicado fica em `~/homepage-site/` e os links em
`~/homepage-data/links.json`.

## Gerenciar os links sem rebuild

`links.json` e montado por fora do site. O deploy so o cria na primeira vez
(`--ignore-existing`) e nunca sobrescreve depois, entao basta editar no servidor:

```bash
nano ~/homepage-data/links.json
```

A mudanca vale no proximo carregamento da pagina, sem restart e sem deploy.
O arquivo em `public/data/links.json` continua servindo ao desenvolvimento local
e como valor inicial.

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
