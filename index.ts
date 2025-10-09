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

            const ny_list: string = 'CREATE TABLE IF NOT EXISTS'; // list laging hjelper for ny database lister

            const id: string = 'id INTEGER PRIMARY KEY'; // primary id hjelper for ny database lister
            const antall: string = 'antall REAL'; // antall hjelper for ny database lister

            // lag ikke input listene
            this.#db.run(`${ny_list} Inventar (${id}, navn TEXT, pris REAL, ${antall})`);
            this.#db.run(`${ny_list} Salg (${id}, vare_id REAL, dato TEXT, ${antall})`);

            // lag input listene
            this.#db.run(`${ny_list} Inventar_Input (${id}, navn TEXT, pris REAL, ${antall})`);
            this.#db.run(`${ny_list} Salg_Input (${id}, vare_id REAL, dato TEXT, ${antall})`);

            // etter på, lagring av rows
            this.#lagring_av_rows();
        }

        // privat funksjon til lagring av liste rows
        #lagring_av_rows(): void {
            // lag lageret for inventar
            const inventar_lager = this.#db.prepare('INSERT INTO Inventar (navn, pris, antall) VALUES (?, ?, ?)');
            inventar_lager.run('Jus', 99, 1);

            // lag lageret for salg
            const salg_lager = this.#db.prepare('INSERT INTO Salg (dato, antall) VALUES (?, ?)');
            salg_lager.run(1, '03-03-2023', 3);

            // kjøre lagring av liste rows (ikke input)
            inventar_lager.finalize();
            salg_lager.finalize();

            // hent og logg lister for ikke input
            this.#hent_og_logg_lister(false);

            // hent prompt sync fra npm biblioteket
            const prompt = require('prompt-sync')(); // da får man prompt funksjonen på node

            // lag samtykke input
            let samtykke: string | undefined = prompt("Vil du lage en vare? ")?.toLowerCase();

            // lag en løkke for å håndtere laging av varer
            while (samtykke != "ferdig" && samtykke != "stopp" && samtykke != "") { // stopp om man vil ikke fortsette ("ferdig" eller "stopp" eller tom)
                // lag en navn input
                let navn: string | null = String(prompt("Lag navn for varen: ", ""));

                // håndtere ugyldig navn
                if (!navn || navn === "") {
                    console.error("Ugyldig navn!");
                    return;
                }

                // lag en pris input
                let pris: number | null = Number(prompt("Lag pris for varen: ", 0));

                // beskytt pris mot NaN og mot ugyldig pris
                if (isNaN(pris) || !pris || pris === 0) {
                    console.error("Ugyldig pris!");
                    return;
                }

                // lag antall input
                let antall: number | null = Number(prompt("Lag antall av varen: ", 0));

                // beskytt antall mot NaN og mot ugyldig antall
                if (isNaN(antall) || !antall || antall === 0) {
                    console.error("Ugyldig antall!");
                    return;
                }

                // unngå inventar input laging krasjer
                try {
                    // lag varer fra input for inventar
                    const inventar_inp_lager = this.#db.prepare('INSERT INTO Inventar_Input (navn, pris, antall) VALUES (?, ?, ?)');
                    inventar_inp_lager.run(navn, pris, antall);
                    // kjøre lagring av liste rows for inventar input
                    inventar_inp_lager.finalize();
                } catch (err) {
                    if (err) {
                        this.#db.close();
                        throw new Error(`Kunne ikke lage varen!" ${err}`);
                    }
                }

                // spør man igjen, samtykke
                samtykke = prompt("Vil du lage en vare? ")?.toLowerCase();
            }

            // man samtykker ikke, vis resultat
            this.#hent_og_logg_lister(true);
            console.log("OK!");
        }

        // privat funksjon til henting av lister for logging
        #hent_og_logg_lister(er_inp: boolean): void {
            // håndtere ikke input lister
            if (!er_inp) {
                // hent og logg data for inventar
                this.#db.each('SELECT * FROM Inventar', (err: Error | null, row: any) => {
                    // logg tabell logging feil og avslutt database connection, om feil skjer
                    if (err) {
                        this.#db.close();
                        throw new Error(`Kunne ikke hente data for inventar (ikke input)! ${err.message}`);
                    }
                    // ingen feil, logg resultatet
                    console.log(`${row.id} — ${row.navn} — ${row.pris} — ${row.antall}`)
                });

                // hent og logg data for salg
                this.#db.each('SELECT * FROM Salg', (err: Error | null, row: any) => {
                    // logg tabell logging feil og avslutt database connection, om feil skjer
                    if (err) {
                        this.#db.close();
                        throw new Error(`Kunne ikke hente data for salg (ikke input)! ${err.message}`);
                    }
                    // ingen feil, logg resultatet
                    console.log(`${row.id} — ${row.vare_id} — ${row.dato} — ${row.antall}`)
            });
            // håndtere input lister
            } else {
            // hent og logg data for inventar input
            this.#db.each('SELECT * FROM Inventar_Input', (err: Error | null, row: any) => {
                // logg tabell logging feil og avslutt database connection, om feil skjer
                if (err) {
                    this.#db.close();
                    throw new Error(`Kunne ikke hente data for inventar input! ${err.message}`);
                }
                // ingen feil, logg resultatet
                console.log(`${row.id} — ${row.navn} — ${row.pris} — ${row.antall}`)
            });

            // hent og logg data for salg input
            this.#db.each('SELECT * FROM Salg_Input', (err: Error | null, row: any) => {
                // logg tabell logging feil og avslutt database connection, om feil skjer
                if (err) {
                    this.#db.close();
                    throw new Error(`Kunne ikke hente data for salg input! ${err.message}`);
                }
                // ingen feil, logg resultatet
                console.log(`${row.id} — ${row.vare_id} — ${row.dato} — ${row.antall}`)
            });

            // til slutt, avslutt den tabell connection etter 3 sekunder
            setTimeout(() => {
                this.#db.close();
            }, 3000)
            }
        }
    }

    // kjøre koden til klasse
    new Klasse();
})();
