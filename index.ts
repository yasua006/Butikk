// vi bruker node.js for å få sqlite3

// IIFE med klasse = dobbelt så mye sikkerhet. Ikke redundant!
(() => { // Arrow IIFE
    'use strict'; // hjelper med feil i kjøre tid

    // lag en klasse
    class Klasse {
        // gjor disse til privat
        #sqlite3;
        #db;

        // lag en constructor for lett navigering
        constructor () {
            // hent sqlite3 fra npm biblioteket
            this.#sqlite3 = require('sqlite3');

            // sjekk og håndtere om require for sqlite3 var fant
            if (!this.#sqlite3) {
                console.error("Ingen sqlite3 fant!");
                return;
            }

            // lag en ny database connection
            this.#db = new this.#sqlite3.Database('database.sqlite');
            
            // håndtere feil for database laging
            if (!this.#db) {
                console.error("Ingen database fant!");
                return;
            }

            // begyn ved å lage listene
            this.#lag_lister();
        }

        // privat funksjon til å håndtere lagring av tom lister
        #lag_lister(): void {
            this.#db.serialize();

            // lag listene
            this.#db.run('CREATE TABLE IF NOT EXISTS Inventar (id INTEGER PRIMARY KEY, navn TEXT, pris REAL, antall REAL)');
            this.#db.run('CREATE TABLE IF NOT EXISTS Salg (id INTEGER PRIMARY KEY, vare_id INTEGER SECONDARY KEY, dato TEXT, antall REAL)');

            // lag input listene
            this.#db.run('CREATE TABLE IF NOT EXISTS Inventar_Input (id INTEGER PRIMARY KEY, navn TEXT, pris REAL, antall REAL)');
            this.#db.run('CREATE TABLE IF NOT EXISTS Salg_Input (id INTEGER PRIMARY KEY, vare_id REAL, dato TEXT, antall REAL)');

            this.#lagring_av_rows();
        }

        // privat funksjon til lagring av liste rows
        #lagring_av_rows(): void {
            // lag lageret for inventar
            const inventar_lager = this.#db.prepare('INSERT INTO Inventar (navn, pris, antall) VALUES (?, ?, ?)');
            inventar_lager.run('Jus', 99, 1);
            inventar_lager.finalize();

            // lag lageret for salg
            const salg_lager = this.#db.prepare('INSERT INTO Salg (dato, antall) VALUES (?, ?)');
            salg_lager.run('03-03-2023', 3);
            salg_lager.finalize();

            // hent prompt sync fra npm biblioteket 
            const prompt = require('prompt-sync')();

            // lag samtykke input
            let samtykke: string | undefined = prompt("Vil du lage en vare? ")?.toLowerCase();

            // lag en løkke for å håndtere laging av varer
            for (let step = 1; step < 2; step++) {
                // stopp om man vil ikke fortsette ("ferdig" eller "stopp" eller tom)
                if (samtykke != "ferdig" && samtykke != "stopp" && samtykke != "") {
                    // lag en navn input
                    let navn: string | null = String(prompt("Lag navn for varen: ", ""));

                    // håndtere ugyldig navn
                    if (!navn || navn === "") {
                        console.error("Ugyldig navn!");
                        return;
                    }

                    // lag en pris input
                    let pris: number | null = Number(prompt("Lag pris for varen: ", 0));

                    // beskytt pris mot NaN
                    if (!pris) {
                        console.error("Ugyldig pris!");
                        return;
                    }

                    // lag antall input
                    let antall: number | null = Number(prompt("Lag antall av varen: ", 0));

                    // beskytt antall mot NaN
                    if (!antall) {
                        console.error("Ugyldig antall!");
                        return;
                    }

                    console.log(samtykke, navn, pris, antall);

                    // unngå inventar input laging krasjer
                    try {
                        // lag varer fra input for inventar
                        const inventar_inp_lager = this.#db.prepare('INSERT INTO Inventar_Input (navn, pris, antall) VALUES (?, ?, ?)');
                        inventar_inp_lager.run(navn, pris, antall);
                        inventar_inp_lager.finalize();
                    } catch (err) {
                        if (err) {
                            this.#db.close();
                            throw new Error("Kunne ikke lage varen!", err);
                        }
                    }

                    // spør man igjen, samtykke
                    samtykke = prompt("Vil du lage en vare? ")?.toLowerCase();
                }
            }

            // unngå hent og logging av tabeller, når man samtykker
            if (samtykke != "ferdig" && samtykke != "stopp" && samtykke != "") {
                // etter på, hent og logg tabeller
                this.#hent_og_logg_tabeller();
            }

            // man samtykker ikke
            console.log("OK!")
        }

        // privat funksjon til henting av data for logging
        #hent_og_logg_tabeller(): void {
            // hent og logg data for inventar
            this.#db.each('SELECT * FROM Inventar', (err: Error | null, row: any) => {
                // logg tabell logging feil og avslutt database connection, om feil skjer
                if (err) {
                    this.#db.close();
                    throw new Error(err.message);
                }
                // ingen feil, logg resultatet
                console.log(`${row.id} — ${row.navn} — ${row.pris} — ${row.antall}`)
            });

            // hent og logg data for salg
            this.#db.each('SELECT * FROM Salg', (err: Error | null, row: any) => {
                // logg tabell logging feil og avslutt database connection, om feil skjer
                if (err) {
                    this.#db.close();
                    throw new Error(err.message);
                }
                // ingen feil, logg resultatet
                console.log(`${row.id} — ${row.vare_id} — ${row.dato} — ${row.antall}`)
            });

            // hent og logg data for inventar input
            this.#db.each('SELECT * FROM Inventar_Input', (err: Error | null, row: any) => {
                // logg tabell logging feil og avslutt database connection, om feil skjer
                if (err) {
                    this.#db.close();
                    throw new Error(err.message);
                }
                // ingen feil, logg resultatet
                console.log(`${row.id} — ${row.navn} — ${row.pris} — ${row.antall}`)
            });

            // hent og logg data for salg input
            this.#db.each('SELECT * FROM Salg_Input', (err: Error | null, row: any) => {
                // logg tabell logging feil og avslutt database connection, om feil skjer
                if (err) {
                    this.#db.close();
                    throw new Error(err.message);
                }
                // ingen feil, logg resultatet
                console.log(`${row.id} — ${row.navn} — ${row.pris} — ${row.antall}`)
            });

            // til slutt, avslutt den tabell connection etter 5 sekunder
            setTimeout(() => {
                this.#db.close();
            }, 3000)
        }
    }

    // kjøre koden til klasse
    new Klasse();
})();
