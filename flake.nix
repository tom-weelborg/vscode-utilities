{
  description = "vscode-utilities";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
  let
    system = "x86_64-linux";
    pkgs = import nixpkgs { inherit system; };
  in
  {
    devShells.${system}.default = pkgs.mkShell {
      packages = with pkgs; [
        nodejs
        self.packages.${system}.default
      ];
      shellHook = ''
        npm i
      '';
    };

    packages.${system} = rec {
      default = vscode-utilities;
      vscode-utilities = pkgs.buildNpmPackage {
        pname = "vscode-utilities";
        version = "1.0.0";
        src = ./.;
        npmDepsHash = "sha256-yW5Cs802L7WiwbYpxxIyz/FSSazfOgpD09FoH7vWvZY=";
      };
    };
  };
}
