module.exports = /******/ (() => {
  // webpackBootstrap
  /******/ var __webpack_modules__ = {
    /***/ 641: /***/ (
      __unused_webpack_module,
      __unused_webpack_exports,
      __nccwpck_require__
    ) => {
      const core = __nccwpck_require__(186);
      const { GITHUB_ACTIONS_BOT_NAME } = __nccwpck_require__(71);
      const fs = __nccwpck_require__(747);

      /**
       * Creates teams based on the names that are in the "people" folder. It checks
       * whether there are any existing teams and attempts to restore them if so. It will
       * then randomly assign each newly added person to a random team.
       */
      const createTeams = async () => {
        try {
          const team_size = core.getInput("team_size");
          const total_people = core.getInput("total_people");
          const total_teams = Math.floor(total_people / team_size);

          console.log(`Total people: ${total_people}`);
          console.log(`Total per team: ${team_size}`);
          console.log(`Total teams: ${total_teams}`);

          const teams_file_path = `${process.env.GITHUB_WORKSPACE}/public/resources/teams.json`;
          const teams_file_contents = fs.readFileSync(teams_file_path);

          const people_folder_path = `${process.env.GITHUB_WORKSPACE}/people`;
          const people = fs
            .readdirSync(people_folder_path)
            .filter((person) => person !== GITHUB_ACTIONS_BOT_NAME);

          let existing_teams;

          try {
            existing_teams = JSON.parse(teams_file_contents).teams;
          } catch {
            // This catch runs when someone tampers with "teams.json" manually.
            existing_teams = [[]];

            // eslint-disable-next-line no-console
            console.log(
              "An error occured while trying to restore existing teams."
            );
          }

          const remove_tuples = [];

          // Remove orphans i.e. names that exist in teams.json but not in the people folder.
          existing_teams.forEach((team, team_idx) => {
            team.forEach((person, person_idx) => {
              if (!people.includes(person)) {
                remove_tuples.push([team_idx, person_idx]);
              }
            });
          });

          if (remove_tuples.length) {
            console.log("Found some orphaned people:");

            remove_tuples.forEach(([team_idx, person_idx]) => {
              console.log(`- ${existing_teams[team_idx][person_idx]}`);
              existing_teams[team_idx].splice(person_idx, 1);
            });
          }

          /**
           * Get the newly added names (they weren't part of the "teams.json" yet).
           * We'll use this later to set a COMMIT_MSG.
           */
          const new_names = people.reduce((names, person) => {
            return existing_teams.some((team) => team.includes(person))
              ? names
              : [...names, person];
          }, []);

          console.log("New names:", { new_names });

          const teams = [...existing_teams];

          if (teams.length < total_teams) {
            for (let i = teams.length; i < total_teams; i++) {
              teams.push([]);
            }
          }

          // Assign each new person to a random team.
          new_names.forEach((person) => {
            let iterations = 0;

            while (true) {
              const random_idx = Math.floor(Math.random() * total_teams);
              const random_team = teams[random_idx];

              if (random_team.length < team_size) {
                random_team.push(person);
                break;
              }

              /**
               * Loop trap. If this is (ever) triggered, either:
               * - Wait for the next merge to main so this resolves itself.
               * - Trigger the action manually.
               */
              if (iterations > 100) {
                break;
              }

              iterations++;
            }
          });

          /**
           * Write updates teams to the "teams.json" file. In the next step we'll
           * check whether the file has been updated. And if so, we'll create a new
           * PR there.
           */
          fs.writeFileSync(teams_file_path, JSON.stringify({ teams }, null, 4));
          console.log({ teams, new_names });

          if (new_names.length === 1) {
            core.setOutput(
              "commit_msg",
              `feat: add ${new_names[0]} to teams.json`
            );
          } else if (new_names.length > 1) {
            const first_names = new_names.slice(0, new_names.length).join(", ");
            const last_name = new_names[new_names.length - 1];
            core.setOutput(
              "commit_msg",
              `feat: add ${first_names} and ${last_name} to teams.json`
            );
          } else {
            core.setOutput("commit_msg", `feat: remove orphans`);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log({ error });
        }
      };

      createTeams().catch((e) => core.setFailed(e));

      /***/
    },

    /***/ 71: /***/ (
      __unused_webpack_module,
      __webpack_exports__,
      __nccwpck_require__
    ) => {
      "use strict";
      __nccwpck_require__.r(__webpack_exports__);
      /* harmony export */ __nccwpck_require__.d(__webpack_exports__, {
        /* harmony export */ GITHUB_ACTIONS_BOT_NAME: () =>
          /* binding */ GITHUB_ACTIONS_BOT_NAME,
        /* harmony export */ review_events: () => /* binding */ review_events,
        /* harmony export */ review_states: () => /* binding */ review_states,
        /* harmony export */
      });
      // If anyone decides that github-actions[bot] isn't worthy of commenting
      // and wants to update it to another user (e.g. DerivFE), please update it here.
      const GITHUB_ACTIONS_BOT_NAME = "github-actions[bot]";

      const review_events = Object.freeze({
        APPROVE: "APPROVE",
        COMMENT: "COMMENT",
        REQUEST_CHANGES: "REQUEST_CHANGES",
      });

      const review_states = Object.freeze({
        APPROVED: "APPROVED",
        COMMENTED: "COMMENTED",
        CHANGES_REQUESTED: "CHANGES_REQUESTED",
      });

      /***/
    },

    /***/ 351: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__
    ) {
      "use strict";

      var __importStar =
        (this && this.__importStar) ||
        function (mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null)
            for (var k in mod)
              if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
          result["default"] = mod;
          return result;
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      const os = __importStar(__nccwpck_require__(87));
      const utils_1 = __nccwpck_require__(278);
      /**
       * Commands
       *
       * Command Format:
       *   ::name key=value,key=value::message
       *
       * Examples:
       *   ::warning::This is the message
       *   ::set-env name=MY_VAR::some value
       */
      function issueCommand(command, properties, message) {
        const cmd = new Command(command, properties, message);
        process.stdout.write(cmd.toString() + os.EOL);
      }
      exports.issueCommand = issueCommand;
      function issue(name, message = "") {
        issueCommand(name, {}, message);
      }
      exports.issue = issue;
      const CMD_STRING = "::";
      class Command {
        constructor(command, properties, message) {
          if (!command) {
            command = "missing.command";
          }
          this.command = command;
          this.properties = properties;
          this.message = message;
        }
        toString() {
          let cmdStr = CMD_STRING + this.command;
          if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += " ";
            let first = true;
            for (const key in this.properties) {
              if (this.properties.hasOwnProperty(key)) {
                const val = this.properties[key];
                if (val) {
                  if (first) {
                    first = false;
                  } else {
                    cmdStr += ",";
                  }
                  cmdStr += `${key}=${escapeProperty(val)}`;
                }
              }
            }
          }
          cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
          return cmdStr;
        }
      }
      function escapeData(s) {
        return utils_1
          .toCommandValue(s)
          .replace(/%/g, "%25")
          .replace(/\r/g, "%0D")
          .replace(/\n/g, "%0A");
      }
      function escapeProperty(s) {
        return utils_1
          .toCommandValue(s)
          .replace(/%/g, "%25")
          .replace(/\r/g, "%0D")
          .replace(/\n/g, "%0A")
          .replace(/:/g, "%3A")
          .replace(/,/g, "%2C");
      }
      //# sourceMappingURL=command.js.map

      /***/
    },

    /***/ 186: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__
    ) {
      "use strict";

      var __awaiter =
        (this && this.__awaiter) ||
        function (thisArg, _arguments, P, generator) {
          function adopt(value) {
            return value instanceof P
              ? value
              : new P(function (resolve) {
                  resolve(value);
                });
          }
          return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
              try {
                step(generator.next(value));
              } catch (e) {
                reject(e);
              }
            }
            function rejected(value) {
              try {
                step(generator["throw"](value));
              } catch (e) {
                reject(e);
              }
            }
            function step(result) {
              result.done
                ? resolve(result.value)
                : adopt(result.value).then(fulfilled, rejected);
            }
            step(
              (generator = generator.apply(thisArg, _arguments || [])).next()
            );
          });
        };
      var __importStar =
        (this && this.__importStar) ||
        function (mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null)
            for (var k in mod)
              if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
          result["default"] = mod;
          return result;
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      const command_1 = __nccwpck_require__(351);
      const file_command_1 = __nccwpck_require__(717);
      const utils_1 = __nccwpck_require__(278);
      const os = __importStar(__nccwpck_require__(87));
      const path = __importStar(__nccwpck_require__(622));
      /**
       * The code to exit an action
       */
      var ExitCode;
      (function (ExitCode) {
        /**
         * A code indicating that the action was successful
         */
        ExitCode[(ExitCode["Success"] = 0)] = "Success";
        /**
         * A code indicating that the action was a failure
         */
        ExitCode[(ExitCode["Failure"] = 1)] = "Failure";
      })((ExitCode = exports.ExitCode || (exports.ExitCode = {})));
      //-----------------------------------------------------------------------
      // Variables
      //-----------------------------------------------------------------------
      /**
       * Sets env variable for this action and future actions in the job
       * @param name the name of the variable to set
       * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function exportVariable(name, val) {
        const convertedVal = utils_1.toCommandValue(val);
        process.env[name] = convertedVal;
        const filePath = process.env["GITHUB_ENV"] || "";
        if (filePath) {
          const delimiter = "_GitHubActionsFileCommandDelimeter_";
          const commandValue = `${name}<<${delimiter}${os.EOL}${convertedVal}${os.EOL}${delimiter}`;
          file_command_1.issueCommand("ENV", commandValue);
        } else {
          command_1.issueCommand("set-env", { name }, convertedVal);
        }
      }
      exports.exportVariable = exportVariable;
      /**
       * Registers a secret which will get masked from logs
       * @param secret value of the secret
       */
      function setSecret(secret) {
        command_1.issueCommand("add-mask", {}, secret);
      }
      exports.setSecret = setSecret;
      /**
       * Prepends inputPath to the PATH (for this action and future actions)
       * @param inputPath
       */
      function addPath(inputPath) {
        const filePath = process.env["GITHUB_PATH"] || "";
        if (filePath) {
          file_command_1.issueCommand("PATH", inputPath);
        } else {
          command_1.issueCommand("add-path", {}, inputPath);
        }
        process.env[
          "PATH"
        ] = `${inputPath}${path.delimiter}${process.env["PATH"]}`;
      }
      exports.addPath = addPath;
      /**
       * Gets the value of an input.  The value is also trimmed.
       *
       * @param     name     name of the input to get
       * @param     options  optional. See InputOptions.
       * @returns   string
       */
      function getInput(name, options) {
        const val =
          process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";
        if (options && options.required && !val) {
          throw new Error(`Input required and not supplied: ${name}`);
        }
        return val.trim();
      }
      exports.getInput = getInput;
      /**
       * Sets the value of an output.
       *
       * @param     name     name of the output to set
       * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function setOutput(name, value) {
        command_1.issueCommand("set-output", { name }, value);
      }
      exports.setOutput = setOutput;
      /**
       * Enables or disables the echoing of commands into stdout for the rest of the step.
       * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
       *
       */
      function setCommandEcho(enabled) {
        command_1.issue("echo", enabled ? "on" : "off");
      }
      exports.setCommandEcho = setCommandEcho;
      //-----------------------------------------------------------------------
      // Results
      //-----------------------------------------------------------------------
      /**
       * Sets the action status to failed.
       * When the action exits it will be with an exit code of 1
       * @param message add error issue message
       */
      function setFailed(message) {
        process.exitCode = ExitCode.Failure;
        error(message);
      }
      exports.setFailed = setFailed;
      //-----------------------------------------------------------------------
      // Logging Commands
      //-----------------------------------------------------------------------
      /**
       * Gets whether Actions Step Debug is on or not
       */
      function isDebug() {
        return process.env["RUNNER_DEBUG"] === "1";
      }
      exports.isDebug = isDebug;
      /**
       * Writes debug message to user log
       * @param message debug message
       */
      function debug(message) {
        command_1.issueCommand("debug", {}, message);
      }
      exports.debug = debug;
      /**
       * Adds an error issue
       * @param message error issue message. Errors will be converted to string via toString()
       */
      function error(message) {
        command_1.issue(
          "error",
          message instanceof Error ? message.toString() : message
        );
      }
      exports.error = error;
      /**
       * Adds an warning issue
       * @param message warning issue message. Errors will be converted to string via toString()
       */
      function warning(message) {
        command_1.issue(
          "warning",
          message instanceof Error ? message.toString() : message
        );
      }
      exports.warning = warning;
      /**
       * Writes info to log with console.log.
       * @param message info message
       */
      function info(message) {
        process.stdout.write(message + os.EOL);
      }
      exports.info = info;
      /**
       * Begin an output group.
       *
       * Output until the next `groupEnd` will be foldable in this group
       *
       * @param name The name of the output group
       */
      function startGroup(name) {
        command_1.issue("group", name);
      }
      exports.startGroup = startGroup;
      /**
       * End an output group.
       */
      function endGroup() {
        command_1.issue("endgroup");
      }
      exports.endGroup = endGroup;
      /**
       * Wrap an asynchronous function call in a group.
       *
       * Returns the same type as the function itself.
       *
       * @param name The name of the group
       * @param fn The function to wrap in the group
       */
      function group(name, fn) {
        return __awaiter(this, void 0, void 0, function* () {
          startGroup(name);
          let result;
          try {
            result = yield fn();
          } finally {
            endGroup();
          }
          return result;
        });
      }
      exports.group = group;
      //-----------------------------------------------------------------------
      // Wrapper action state
      //-----------------------------------------------------------------------
      /**
       * Saves state for current action, the state can only be retrieved by this action's post job execution.
       *
       * @param     name     name of the state to store
       * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function saveState(name, value) {
        command_1.issueCommand("save-state", { name }, value);
      }
      exports.saveState = saveState;
      /**
       * Gets the value of an state set by this action's main execution.
       *
       * @param     name     name of the state to get
       * @returns   string
       */
      function getState(name) {
        return process.env[`STATE_${name}`] || "";
      }
      exports.getState = getState;
      //# sourceMappingURL=core.js.map

      /***/
    },

    /***/ 717: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__
    ) {
      "use strict";

      // For internal use, subject to change.
      var __importStar =
        (this && this.__importStar) ||
        function (mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null)
            for (var k in mod)
              if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
          result["default"] = mod;
          return result;
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      // We use any as a valid input type
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const fs = __importStar(__nccwpck_require__(747));
      const os = __importStar(__nccwpck_require__(87));
      const utils_1 = __nccwpck_require__(278);
      function issueCommand(command, message) {
        const filePath = process.env[`GITHUB_${command}`];
        if (!filePath) {
          throw new Error(
            `Unable to find environment variable for file command ${command}`
          );
        }
        if (!fs.existsSync(filePath)) {
          throw new Error(`Missing file at path: ${filePath}`);
        }
        fs.appendFileSync(
          filePath,
          `${utils_1.toCommandValue(message)}${os.EOL}`,
          {
            encoding: "utf8",
          }
        );
      }
      exports.issueCommand = issueCommand;
      //# sourceMappingURL=file-command.js.map

      /***/
    },

    /***/ 278: /***/ (__unused_webpack_module, exports) => {
      "use strict";

      // We use any as a valid input type
      /* eslint-disable @typescript-eslint/no-explicit-any */
      Object.defineProperty(exports, "__esModule", { value: true });
      /**
       * Sanitizes an input into a string so it can be passed into issueCommand safely
       * @param input input to sanitize into a string
       */
      function toCommandValue(input) {
        if (input === null || input === undefined) {
          return "";
        } else if (typeof input === "string" || input instanceof String) {
          return input;
        }
        return JSON.stringify(input);
      }
      exports.toCommandValue = toCommandValue;
      //# sourceMappingURL=utils.js.map

      /***/
    },

    /***/ 747: /***/ (module) => {
      "use strict";
      module.exports = require("fs");

      /***/
    },

    /***/ 87: /***/ (module) => {
      "use strict";
      module.exports = require("os");

      /***/
    },

    /***/ 622: /***/ (module) => {
      "use strict";
      module.exports = require("path");

      /***/
    },

    /******/
  }; // The module cache
  /************************************************************************/
  /******/ /******/ var __webpack_module_cache__ = {}; // The require function
  /******/
  /******/ /******/ function __nccwpck_require__(moduleId) {
    /******/ // Check if module is in cache
    /******/ if (__webpack_module_cache__[moduleId]) {
      /******/ return __webpack_module_cache__[moduleId].exports;
      /******/
    } // Create a new module (and put it into the cache)
    /******/ /******/ var module = (__webpack_module_cache__[moduleId] = {
      /******/ // no module.id needed
      /******/ // no module.loaded needed
      /******/ exports: {},
      /******/
    }); // Execute the module function
    /******/
    /******/ /******/ var threw = true;
    /******/ try {
      /******/ __webpack_modules__[moduleId].call(
        module.exports,
        module,
        module.exports,
        __nccwpck_require__
      );
      /******/ threw = false;
      /******/
    } finally {
      /******/ if (threw) delete __webpack_module_cache__[moduleId];
      /******/
    } // Return the exports of the module
    /******/
    /******/ /******/ return module.exports;
    /******/
  } /* webpack/runtime/define property getters */
  /******/
  /************************************************************************/
  /******/ /******/ (() => {
    /******/ // define getter functions for harmony exports
    /******/ __nccwpck_require__.d = (exports, definition) => {
      /******/ for (var key in definition) {
        /******/ if (
          __nccwpck_require__.o(definition, key) &&
          !__nccwpck_require__.o(exports, key)
        ) {
          /******/ Object.defineProperty(exports, key, {
            enumerable: true,
            get: definition[key],
          });
          /******/
        }
        /******/
      }
      /******/
    };
    /******/
  })(); /* webpack/runtime/hasOwnProperty shorthand */
  /******/
  /******/ /******/ (() => {
    /******/ __nccwpck_require__.o = (obj, prop) =>
      Object.prototype.hasOwnProperty.call(obj, prop);
    /******/
  })(); /* webpack/runtime/make namespace object */
  /******/
  /******/ /******/ (() => {
    /******/ // define __esModule on exports
    /******/ __nccwpck_require__.r = (exports) => {
      /******/ if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
        /******/ Object.defineProperty(exports, Symbol.toStringTag, {
          value: "Module",
        });
        /******/
      }
      /******/ Object.defineProperty(exports, "__esModule", { value: true });
      /******/
    };
    /******/
  })(); /* webpack/runtime/compat */
  /******/
  /******/ /******/
  /******/ __nccwpck_require__.ab =
    __dirname +
    "/"; /************************************************************************/ // module exports must be returned from runtime so entry inlining is disabled // startup // Load entry module and return exports
  /******/ /******/ /******/ /******/ return __nccwpck_require__(641);
  /******/
})();