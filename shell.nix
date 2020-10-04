{ pkgs ? import ./nix }:
pkgs.npmlock2nix.shell {
  nodejs = pkgs.nodejs-14_x;
  node_modules_mode = "copy";
  src =  ./.;
}

