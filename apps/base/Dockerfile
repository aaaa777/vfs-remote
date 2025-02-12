from ruby:latest

run apt install -y curl
run curl -fsSL https://deb.nodesource.com/setup_23.x -o nodesource_setup.sh
run bash nodesource_setup.sh
run apt install -y nodejs

run curl https://sh.rustup.rs -sSf | sh -s -- -y
env PATH="/root/.cargo/bin:$PATH"
