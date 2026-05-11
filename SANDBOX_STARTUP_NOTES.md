# MedLab Startup Notes

This project now has two startup paths. The original startup scripts were not changed.

## Source / Original Device

Use this path on a device that already has the normal development dependencies installed and configured:

- Java / Spring runtime
- Maven
- Node.js / npm
- Angular dependencies
- MySQL / MySQL Workbench or local MySQL CLI

Run the original scripts from the project root as usual:

```bat
start-all.bat
debug.bat
stop-all.bat
```

This is the preferred path for the original/source machine where the project was already tested.

## Temporary / Dependency-Light Device

Use this path on a device that does not have Maven, npm, Angular, MySQL Workbench, or local MySQL installed.

First start Docker Desktop manually. Then run the sandbox wrappers:

```bat
sandbox\start-original.bat
sandbox\debug-original.bat
sandbox\stop-original.bat
```

These wrappers prepare a temporary environment and then call the original project scripts. They provide:

- Docker MySQL on `localhost:3306`
- a `mysql` shim backed by the Docker container
- an `mvn` shim that runs the existing prebuilt backend jars
- an `npm start` shim that uses the existing frontend `node_modules`

The goal is to run the project temporarily on this device without installing the full development toolchain.

## Important

Do not replace the original root scripts with the sandbox scripts. The sandbox folder exists only to support machines that do not have the normal dependencies installed.
