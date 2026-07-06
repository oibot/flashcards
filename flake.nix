{
  outputs = { self, nixpkgs }:
    let
      allSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      forAllSystems = f: nixpkgs.lib.genAttrs allSystems (system: f {
        pkgs = import nixpkgs { inherit system; };
      });
    in
    {
      devShells = forAllSystems
        ({ pkgs }: {
          default = pkgs.mkShell
            {
              packages = with pkgs; [
                bun
                git
                nodejs
                python3
                typescript
                watchman
              ]
              # Android/iOS extras per platform:
              ++ pkgs.lib.optionals pkgs.stdenv.isLinux [
                jdk17
                gradle
                android-tools
                (androidenv.androidSdk {
                  platformTools = true;
                  platforms = [ "android-34" ];
                  buildTools = [ "34.0.0" ];
                  ndk = null;
                })
              ]
              ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
                cocoapods
                fastlane
                jdk17
              ];

              shellHook = ''
                export PYTHON=${pkgs.python3}/bin/python3
                export JAVA_HOME="${pkgs.jdk17}"

                # Point to full Xcode, not CommandLineTools
                export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"

                # Put Apple’s toolchains first and *exclude* Nix/LLVM compilers
                export PATH="$DEVELOPER_DIR/Toolchains/XcodeDefault.xctoolchain/usr/bin:$DEVELOPER_DIR/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

                # Remove env vars that force non-Apple toolchains
                unset CC CXX CPP LD AR NM RANLIB LIBTOOL PKG_CONFIG PKG_CONFIG_PATH CPATH LIBRARY_PATH CFLAGS CXXFLAGS LDFLAGS

                ${pkgs.lib.optionalString pkgs.stdenv.isDarwin ''
                  # Some CocoaPods scripts invoke clang directly instead of xcrun.
                  # Supplying SDKROOT lets Apple's clang find libSystem in the SDK.
                  export SDKROOT="$(/usr/bin/xcrun --sdk macosx --show-sdk-path)"
                ''}
              '';
            };
        });
    };
}
