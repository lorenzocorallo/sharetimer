import concurrently from "concurrently";
import chalk from "chalk";

const { result } = concurrently([
  {
    command: "cd frontend && npm run dev",
    name: "CLIENT",
    prefixColor: "blue",
    env: { FORCE_COLOR: "1" },
  },
  {
    command: "cd backend && air",
    name: "SERVER",
    prefixColor: "magenta",
    env: { FORCE_COLOR: "1" },
  },
], {
  prefix: "name",
  timestampFormat: "HH:mm:ss",
  prefixColors: ["blue", "magenta"],
})

result.then(
  () => {},
  (error) => {
    console.error(chalk.red("Error occurred:", error));
    process.exit(1);
  }
);
