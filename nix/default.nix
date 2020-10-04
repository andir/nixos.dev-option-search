let
  sources = import ./sources.nix;
  overlays = [
    (self: super: {
      #npmlock2nix = self.callPackage sources.npmlock2nix { };
      npmlock2nix = self.callPackage ../../npmlock2niux { };
    })
  ];
in
import sources.nixpkgs { inherit overlays; }
