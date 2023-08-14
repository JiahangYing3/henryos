/* eslint-env browser */

import git from 'https://cdn.jsdelivr.net/npm/isomorphic-git@1.24.5/+esm';
import http from 'https://unpkg.com/isomorphic-git/http/web/index.js';
import parser from '../parser.js';

export const metadata = {
    cmd: 'git',
    description: 'List information about the FILEs (the current directory by default).'
};

export const exec = async (fs, term, usr, dir, args) => {
    const { options, vars, values } = parser(args);

    console.log(options, values, vars);

    return new Promise(async (resolve, reject) => {
        if (values[0] == 'clone') {
            const cfg = {
                quiet: false,
                depth: 1,
                noCheckout: false,
                noTags: false,
                singleBranch: true,
            };

            let path;
            if (!values[2]) { path = fs.realpathSync(dir.path); };

            if (path !== '/' && values[2].startsWith('/')) {
                path = values[2];
            } else if (path !== '/') {
                path = fs.realpathSync(dir.path) == '/' ? `/${values[2]}` : `${fs.realpathSync(dir.path)}/${values[2]}`;
            };

            if (options.includes('-q') || options.includes('--quiet')) cfg.quiet = true;
            if (options.includes('-n') || options.includes('--no-checkout')) cfg.noCheckout = true;
            if (options.includes('--no-tags')) cfg.noTags = true;
            if (options.includes('--single-branch')) cfg.singleBranch = true;
            if (options.includes('--no-single-branch')) cfg.singleBranch = false;

            if (vars.depth) cfg.depth = vars.depth;
            if (vars['shallow-since']) cfg.since = new Date(vars['shallow-since']);
            if (vars['shallow-exclude']) cfg.exclude = vars['shallow-exclude'];

            if (cfg.quiet !== true) term.writeln(`Cloning into '${values[1].split(/(\\|\/)/g).pop()}'...`);

            await git.clone({
                fs,
                http,
                dir: values[2] ?? `${dir.path}/${values[1].split(/(\\|\/)/g).pop()}`,
                corsProxy: 'https://cors.isomorphic-git.org',
                url: values[1],
                noCheckout: cfg.noCheckout,
                singleBranch: cfg.singleBranch,
                depth: cfg.depth,
                noTags: cfg.noTags,
                since: cfg.since,
                exclude: cfg.exclude,
                onMessage: (e) => {
                    if (cfg.quiet !== true) term.writeln(e);
                },
            });
            resolve('');
            return;
        }
        if (values[0] == 'init') {
            const cfg = {
                quiet: false,
                bare: false,
                defaultBranch: 'master',
            };

            if (options.includes('-q') || options.includes('--quiet')) cfg.quiet = true;
            if (options.includes('--bare')) cfg.bare = true;

            if (vars['initial-branch']) cfg.defaultBranch = vars['initial-branch'];
            if (vars['separate-git-dir']) cfg.gitdir = vars['separate-git-dir'];

            await git.init({
                fs,
                http,
                dir: values[1] ?? dir.path,
                bare: cfg.bare,
                defaultBranch: cfg.defaultBranch,
                gitdir: cfg.gitdir
            });

            if (cfg.quiet !== true) term.writeln(`Initialized empty Git repository in ${fs.realpathSync(values[1]) ?? dir.path}/.git/`);

            resolve('');
            return;
        }
        if (values[0] == 'checkout') {
            const cfg = {
                quiet: false,
            };

            if (options.includes('-q') || options.includes('--quiet')) cfg.quiet = true;

            await git.checkout({
                fs,
                dir: dir.path
            }).then(async () => {
                let branch = await git.currentBranch({
                    fs,
                    dir: dir.path,
                    fullname: false
                });
    
                if (cfg.quiet !== true) term.writeln(`Switched branch to '${branch}'`);
            }).catch((e) => {
                reject(e);
                return e;
            });

            resolve('');
            return;
        }
        if (values[0] == 'add') {
            await git.add({
                fs,
                dir: dir.path,
                filepath: values[1],
            });

            resolve('');
            return;
        }
        if (values[0] == 'rm') {
            await git.remove({
                fs,
                dir: dir.path,
                filepath: values[1],
            });

            resolve('');
            return;
        }
        if (values[0] == 'status') {
            let status = await git.status({
                fs,
                dir: dir.path,
                filepath: values[1],
            });

            resolve(status);
            return;
        }
        if (values[0] == 'pull') {
            const cfg = {
                quiet: false,
            };

            if (options.includes('-q') || options.includes('--quiet')) cfg.quiet = true;

            await git.pull({
                fs,
                http,
                dir: dir.path,
                corsProxy: 'https://cors.isomorphic-git.org',
                author: {
                    name: 'Mr. Test',
                    email: 'mrtest@example.com',
                },
                onMessage: (e) => {
                    if (cfg.quiet !== true) term.writeln(e);
                },
            }).catch(reject);

            resolve('');
            return;
        }
        if (values[0] == 'push') {
            const cfg = {
                quiet: false,
                force: false
            };

            if (options.includes('-q') || options.includes('--quiet')) cfg.quiet = true;
            if (options.includes('-f') || options.includes('--force')) cfg.force = true;

            class GitError extends Error {}

            if (vars['upstream']) cfg.upstream = vars['upstream'];
            if (vars['gh-token']) cfg.ghtoken = vars['gh-token'];
            else reject(new GitError('--gh-token not specified'));

            await git.push({
                fs,
                http,
                dir: dir.path,
                corsProxy: 'https://cors.isomorphic-git.org',
                remote: cfg.upstream,
                force: cfg.force,
                onMessage: (e) => {
                    if (cfg.quiet !== true) term.writeln(e);
                },
                author: {
                    name: usr.username,
                    email: 'flowos@example.com'
                },
                onAuth: () => { return { username: cfg.ghtoken }; }
            }).catch(reject);

            resolve('');
            return;
        }
        if (values[0] == 'fetch') {
            const cfg = {
                quiet: false,
                depth: 1,
                tags: false,
                singleBranch: true,
            };

            let path;
            if (!values[2]) { path = fs.realpathSync(dir.path); };

            if (path !== '/' && values[2].startsWith('/')) {
                path = values[2];
            } else if (path !== '/') {
                path = fs.realpathSync(dir.path) == '/' ? `/${values[2]}` : `${fs.realpathSync(dir.path)}/${values[2]}`;
            };

            if (options.includes('-q') || options.includes('--quiet')) cfg.quiet = true;
            if (options.includes('-t') || options.includes('--tags')) cfg.tags = true;
            if (options.includes('--single-branch')) cfg.singleBranch = true;
            if (options.includes('--no-single-branch')) cfg.singleBranch = false;

            if (vars.depth) cfg.depth = vars.depth;
            if (vars['shallow-since']) cfg.since = new Date(vars['shallow-since']);
            if (vars['shallow-exclude']) cfg.exclude = vars['shallow-exclude'];

            if (cfg.quiet !== true) term.writeln(`Cloning into '${values[1].split(/(\\|\/)/g).pop()}'...`);

            await git.fetch({
                fs,
                http,
                dir: values[2] ?? `${dir.path}/${values[1].split(/(\\|\/)/g).pop()}`,
                corsProxy: 'https://cors.isomorphic-git.org',
                url: values[1],
                singleBranch: cfg.singleBranch,
                depth: cfg.depth,
                tags: cfg.tags,
                since: cfg.since,
                exclude: cfg.exclude,
                onMessage: (e) => {
                    if (cfg.quiet !== true) term.writeln(e);
                },
            });
            resolve('');
            return;
        }
        if (values[0] == 'commit') {
            const cfg = {
                quiet: false
            };

            if (options.includes('-q') || options.includes('--quiet')) cfg.quiet = true;

            await git.commit({
                fs,
                http,
                dir: dir.path,
                corsProxy: 'https://cors.isomorphic-git.org',
                author: {
                    name: usr.username,
                    email: 'flowos@example.com'
                },
                message: values[1]
            }).catch(reject);

            resolve('');
            return;
        }
        if (options[0] == '--version') {
            resolve(`git version ${git.version()}`);
        } else if (options[0] == '--help') {
            resolve([
                `usage: git [--version] [--help] <command> [<args>]`,
                ``,
                `These are common Git commands used in various situations:`,
                ``,
                `start a working area`,
                `   clone     Clone a repository into a new directory`,
                `   init      Create an empty Git repository or reinitialize an existing one`,
                ``,
                `work on the current change`,
                `   add       Add file contents to the index`,
                `   rm        Remove files from the working tree and from the index`,
                ``,
                `examine the history and state`,
                `   status    Show the working tree status`,
                ``,
                `grow, mark and tweak your common history`,
                `   commit    Record changes to the repository`,
                ``,
                `collaborate`,
                `   fetch     Download objects and refs from another repository`,
                `   pull      Fetch from and integrate with another repository or a local branch`,
                `   push      Update remote refs along with associated objects`
            ]);
        }
    });
};