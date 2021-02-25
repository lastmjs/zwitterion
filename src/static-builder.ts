import { exec as execAsync } from 'child_process';

// TODO this thing is disgusting and isn't cross platform. Figure out how to do this with some node modules that will ensure this works cross-platform
// TODO then again...it's not so bad. It works rather well actually
export function buildStatic(params: {
    exclude: string | undefined;
    include: string | undefined;
    httpPort: number;
}): void {
    const excludeRegex = `${params.exclude ? params.exclude.split(',').join('*|') : 'NO_EXCLUDE'}*`;
    const includeRegex = `${params.include ? params.include.split(',').join('*|') : 'NO_INCLUDE'}*`;

    const asyncExec = execAsync(`
        echo "Copy current working directory to ZWITTERION_TEMP directory"

        originalDirectory=$(pwd)

        rm -rf dist
        cd ..
        rm -rf ZWITTERION_TEMP
        cp -r $originalDirectory ZWITTERION_TEMP
        cd ZWITTERION_TEMP

        echo "Download and save all .html files from Zwitterion"

        shopt -s globstar
        for file in **/*.html; do
            if [[ ! $file =~ ${excludeRegex} ]] || [[ $file =~ ${includeRegex} ]]
            then
                echo $file
                wget -q -x -nH "http://localhost:${params.httpPort}/$file"
            fi
        done

        echo "Download and save all .js files from Zwitterion"

        shopt -s globstar
        for file in **/*.js; do
            if [[ ! $file =~ ${excludeRegex} ]] || [[ $file =~ ${includeRegex} ]]
            then
                echo $file
                wget -q -x -nH "http://localhost:${params.httpPort}/$\{file%.*\}.js"
            fi
        done

        echo "Download and save all .ts files from Zwitterion"

        shopt -s globstar
        for file in **/*.ts; do
            if [[ ! $file =~ ${excludeRegex} ]] || [[ $file =~ ${includeRegex} ]]
            then
                echo $file
                wget -q -x -nH "http://localhost:${params.httpPort}/$\{file%.*\}.ts"
            fi
        done

        echo "Download and save all .as files from Zwitterion"

        shopt -s globstar
        for file in **/*.as; do
            if [[ ! $file =~ ${excludeRegex} ]]
            then
                wget -q -x -nH "http://localhost:${params.httpPort}/$\{file%.*\}.as"
            fi
        done

        echo "Download and save all .wasm files from Zwitterion"

        shopt -s globstar
        for file in **/*.wasm; do
            if [[ ! $file =~ ${excludeRegex} ]]
            then
                wget -q -x -nH "http://localhost:${params.httpPort}/$\{file%.*\}.wasm"
            fi
        done

        echo "Download and save all .rs files from Zwitterion"

        shopt -s globstar
        for file in **/*.rs; do
            if [[ ! $file =~ ${excludeRegex} ]]
            then
                wget -q -x -nH "http://localhost:${params.httpPort}/$\{file%.*\}.rs"
            fi
        done

        echo "Download and save all .tsx files from Zwitterion"

        shopt -s globstar
        for file in **/*.tsx; do
            if [[ ! $file =~ ${excludeRegex} ]] || [[ $file =~ ${includeRegex} ]]
            then
                echo $file
                wget -q -x -nH "http://localhost:${params.httpPort}/$\{file%.*\}.tsx"
            fi
        done

        echo "Download and save all .jsx files from Zwitterion"

        shopt -s globstar
        for file in **/*.jsx; do
            if [[ ! $file =~ ${excludeRegex} ]] || [[ $file =~ ${includeRegex} ]]
            then
                echo $file
                wget -q -x -nH "http://localhost:${params.httpPort}/$\{file%.*\}.jsx"
            fi
        done

        echo "Download and save all .c files from Zwitterion"

        shopt -s globstar
        for file in **/*.c; do
            if [[ ! $file =~ ${excludeRegex} ]]
            then
                wget -q -x -nH "http://localhost:${params.httpPort}/$\{file%.*\}.c"
            fi
        done

        echo "Download and save all .cc files from Zwitterion"

        shopt -s globstar
        for file in **/*.cc; do
            if [[ ! $file =~ ${excludeRegex} ]]
            then
                wget -q -x -nH "http://localhost:${params.httpPort}/$\{file%.*\}.cc"
            fi
        done

        echo "Download and save all .cpp files from Zwitterion"

        shopt -s globstar
        for file in **/*.cpp; do
            if [[ ! $file =~ ${excludeRegex} ]]
            then
                wget -q -x -nH "http://localhost:${params.httpPort}/$\{file%.*\}.cpp"
            fi
        done

        echo "Download and save all .c++ files from Zwitterion"

        shopt -s globstar
        for file in **/*.c++; do
            if [[ ! $file =~ ${excludeRegex} ]]
            then
                wget -q -x -nH "http://localhost:${params.httpPort}/$\{file%.*\}.c++"
            fi
        done

        echo "Download and save all .wat files from Zwitterion"

        shopt -s globstar
        for file in **/*.wat; do
            if [[ ! $file =~ ${excludeRegex} ]]
            then
                wget -q -x -nH "http://localhost:${params.httpPort}/$\{file%.*\}.wat"
            fi
        done

        echo "Copy ZWITTERION_TEMP to dist directory in the project root directory"

        cd ..
        cp -r ZWITTERION_TEMP $originalDirectory/dist
        rm -rf ZWITTERION_TEMP

        echo "Static build finished"
    `, {
        shell: 'bash'
    }, () => {
        process.exit();
    });

    if (
        asyncExec.stdout !== null
    ) {
        asyncExec.stdout.pipe(process.stdout);
    }
    
    if (
        asyncExec.stderr !== null
    ) {
        asyncExec.stderr.pipe(process.stderr);
    }
}