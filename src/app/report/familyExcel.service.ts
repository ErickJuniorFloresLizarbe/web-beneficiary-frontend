import * as XLSX from 'xlsx';
import { Injectable } from '@angular/core';
import { Family } from '../interfaces/familiaDto';
import { Person } from '../interfaces/person';

@Injectable({
    providedIn: 'root',
})
export class FamilyExcelService {

    exportCombined(families: Family[], persons: Person[]): void {
        const groupedFamilies: { [key: string]: Family[] } = {};

        families.forEach(family => {
            const lastName = family.lastName.trim();
            if (!groupedFamilies[lastName]) {
                groupedFamilies[lastName] = [];
            }
            groupedFamilies[lastName].push(family);
        });

        const dataToExport: any[] = [];

        const familyPersonsMap: { [familyId: number]: Person[] } = {};

        persons.forEach(person => {
            if (person.familyIdFamily !== undefined) {
                if (!familyPersonsMap[person.familyIdFamily]) {
                    familyPersonsMap[person.familyIdFamily] = [];
                }
                familyPersonsMap[person.familyIdFamily].push(person);
            }
        });

        Object.keys(groupedFamilies).sort().forEach(lastName => {
            const familiesWithSameLastName = groupedFamilies[lastName];

            familiesWithSameLastName.forEach(family => {
                const familyPersons = familyPersonsMap[family.id] || [];

                if (familyPersons.length === 0) {
                    dataToExport.push(this.createFamilyDataRow(family));
                } else {
                    familyPersons.forEach((person, index) => {
                        dataToExport.push({
                            'Nombre': person.name,
                            'Apellido': person.surname,
                            'Edad': person.age,
                            'Fecha de Nacimiento': person.birthdate,
                            'Tipo de Documento': person.typeDocument,
                            'Número de Documento': person.documentNumber,
                            'Parentesco': person.typeKinship,
                            'Patrocinado': person.sponsored,

                            // Luego datos de familia
                            'Apellido Familiar': family.lastName,
                            'ID Familia': family.id,
                            'Dirección': family.direction,
                            'Motivo de Ingreso': family.reasibAdmission,
                            'N° Miembros': family.numberMembers,
                            'N° Hijos': family.numberChildren,
                            'Tipo de Familia': family.familyType,
                            'Problemas Sociales': family.socialProblems,
                            'Estado': family.status,
                            'Frecuencia Semanal': family.weeklyFrequency,
                            'Tipo de Alimentación': family.feedingType,
                            'Tipo de Seguro': family.safeType,
                            'Enfermedad Familiar': family.familyDisease,
                            'Tratamiento': family.treatment,
                            'Historial de Enfermedad': family.diseaseHistory,
                            'Examen Médico': family.medicalExam,
                            'Tenencia': family.tenure,
                            'Tipo de Vivienda': family.housingDetails.typeOfHousing,
                            'Material de Vivienda': family.housingDetails.housingMaterial,
                            'Seguridad de Vivienda': family.housingDetails.housingSecurity,
                            'Ambiente del Hogar': family.housingDetails.homeEnvironment,
                            'N° de Habitaciones': family.housingDetails.numberRooms,
                            'N° de Dormitorios': family.housingDetails.numberOfBedrooms,
                            'Habitabilidad': family.housingDetails.habitability,
                            'Habitabilidad del Edificio': family.housingDetails.habitabilityBuilding,
                            'Servicio de Agua': family.basicService?.waterService || 'N/A',
                            'Servicio de Desagüe': family.basicService?.servDrain || 'N/A',
                            'Servicio de Luz': family.basicService?.servLight || 'N/A',
                            'Servicio de Cable': family.basicService?.servCable || 'N/A',
                            'Servicio de Gas': family.basicService?.servGas || 'N/A',
                            'Área': family.basicService?.area || 'N/A',
                            'Referencia de Ubicación': family.basicService?.referenceLocation || 'N/A',
                            'Residuos': family.basicService?.residue || 'N/A',
                            'Alumbrado Público': family.basicService?.publicLighting || 'N/A',
                            'Seguridad': family.basicService?.security || 'N/A',
                            'Material': family.basicService?.material || 'N/A',
                            'Alimentación': family.basicService?.feeding || 'N/A',
                            'Económico': family.basicService?.economic || 'N/A',
                            'Espiritual': family.basicService?.spiritual || 'N/A',
                            'Compañía Social': family.basicService?.socialCompany || 'N/A',
                            'Guía Cognitiva': family.basicService?.guideTip || 'N/A',
                        });
                    });
                }
            });
        });

        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);

        const wscols = [
            { wch: 20 },
            { wch: 20 },
            { wch: 10 },
            { wch: 18 },
            { wch: 20 },
            { wch: 20 },
            { wch: 15 },
            { wch: 15 },

            { wch: 20 },
            { wch: 12 },
            { wch: 30 },
            { wch: 25 },
            { wch: 12 },
            { wch: 12 },
            { wch: 18 },
            { wch: 25 },
            { wch: 15 },
            { wch: 18 },
            { wch: 20 },
            { wch: 15 },
            { wch: 20 },
            { wch: 18 },
            { wch: 22 },
            { wch: 18 },
            { wch: 15 },
            { wch: 18 },
            { wch: 20 },
            { wch: 20 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 15 },
            { wch: 22 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 25 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
        ];
        worksheet['!cols'] = wscols;

        this.applyWorksheetStyles(worksheet);
        this.mergeFamilyCells(worksheet, dataToExport);

        const workbook: XLSX.WorkBook = {
            Sheets: { 'Registro Familiar': worksheet },
            SheetNames: ['Registro Familiar'],
        };

        this.addPersonsWorksheet(workbook, families, persons);

        XLSX.writeFile(workbook, 'Registro_Familias_y_Beneficiarios.xlsx');
    }

    private createFamilyDataRow(family: Family): any {
        return {
            'N° de Integrante': '',
            'Nombre': '',
            'Apellido': '',
            'Edad': '',
            'Fecha de Nacimiento': '',
            'Tipo de Documento': '',
            'Número de Documento': '',
            'Parentesco': '',
            'Patrocinado': '',
            'Estado Personal': '',

            'Apellido Familiar': family.lastName,
            'ID Familia': family.id,
            'Dirección': family.direction,
            'Motivo de Ingreso': family.reasibAdmission,
            'N° Miembros': family.numberMembers,
            'N° Hijos': family.numberChildren,
            'Tipo de Familia': family.familyType,
            'Problemas Sociales': family.socialProblems,
            'Estado': family.status,
            'Frecuencia Semanal': family.weeklyFrequency,
            'Tipo de Alimentación': family.feedingType,
            'Tipo de Seguro': family.safeType,
            'Enfermedad Familiar': family.familyDisease,
            'Tratamiento': family.treatment,
            'Historial de Enfermedad': family.diseaseHistory,
            'Examen Médico': family.medicalExam,
            'Tenencia': family.tenure,
            'Tipo de Vivienda': family.housingDetails.typeOfHousing,
            'Material de Vivienda': family.housingDetails.housingMaterial,
            'Seguridad de Vivienda': family.housingDetails.housingSecurity,
            'Ambiente del Hogar': family.housingDetails.homeEnvironment,
            'N° de Habitaciones': family.housingDetails.numberRooms,
            'N° de Dormitorios': family.housingDetails.numberOfBedrooms,
            'Habitabilidad': family.housingDetails.habitability,
            'Habitabilidad del Edificio': family.housingDetails.habitabilityBuilding,
            'Servicio de Agua': family.basicService?.waterService || 'N/A',
            'Servicio de Desagüe': family.basicService?.servDrain || 'N/A',
            'Servicio de Luz': family.basicService?.servLight || 'N/A',
            'Servicio de Cable': family.basicService?.servCable || 'N/A',
            'Servicio de Gas': family.basicService?.servGas || 'N/A',
            'Área': family.basicService?.area || 'N/A',
            'Referencia de Ubicación': family.basicService?.referenceLocation || 'N/A',
            'Residuos': family.basicService?.residue || 'N/A',
            'Alumbrado Público': family.basicService?.publicLighting || 'N/A',
            'Seguridad': family.basicService?.security || 'N/A',
            'Material': family.basicService?.material || 'N/A',
            'Alimentación': family.basicService?.feeding || 'N/A',
            'Económico': family.basicService?.economic || 'N/A',
            'Espiritual': family.basicService?.spiritual || 'N/A',
            'Compañía Social': family.basicService?.socialCompany || 'N/A',
            'Guía Cognitiva': family.basicService?.guideTip || 'N/A',
        };
    }

    private mergeFamilyCells(worksheet: XLSX.WorkSheet, dataToExport: any[]): void {
        if (!worksheet['!ref']) return;

        const range = XLSX.utils.decode_range(worksheet['!ref']);
        let currentFamilyId: any = null;
        let startRow = 1; // Comienza en la fila 1 (después del encabezado)

        worksheet['!merges'] = [];

        for (let r = 1; r <= dataToExport.length; r++) {
            const row = dataToExport[r - 1];
            const familyId = row['ID Familia'];

            if (r === dataToExport.length || (currentFamilyId !== null && currentFamilyId !== familyId)) {
                if (r - startRow > 1) {
                    for (let c = 10; c <= 49; c++) {
                        worksheet['!merges'].push({
                            s: { r: startRow, c: c },
                            e: { r: r - 1, c: c }
                        });
                    }
                }

                startRow = r;
            }

            currentFamilyId = familyId;
        }
    }

    private applyWorksheetStyles(worksheet: XLSX.WorkSheet): void {
        if (!worksheet['!ref']) return;

        const range = XLSX.utils.decode_range(worksheet['!ref']);

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!worksheet[headerCell]) continue;

            let headerColor;
            if (C < 10) {
                headerColor = "2B5797";
            } else if (C < 20) {
                headerColor = "1E7145";
            } else if (C < 30) {
                headerColor = "D24726";
            } else {
                headerColor = "5133AB";
            }

            worksheet[headerCell].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: {
                    patternType: 'solid',
                    fgColor: { rgb: headerColor }
                },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                border: {
                    top: { style: 'medium', color: { rgb: "000000" } },
                    bottom: { style: 'medium', color: { rgb: "000000" } },
                    left: { style: 'medium', color: { rgb: "000000" } },
                    right: { style: 'medium', color: { rgb: "000000" } }
                }
            };
        }

        let lastFamilyId = null;
        let currentFamilyColor = 0;

        const familyColors = [
            {
                person: 'E6F0FF', // Azul muy claro
                family: 'CCE0FF'  // Azul claro
            },
            {
                person: 'FFF0E6', // Naranja muy claro
                family: 'FFE0CC'  // Naranja claro
            }
        ];

        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const idFamiliaCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 11 })]; // ID Familia

            if (idFamiliaCell && (lastFamilyId === null || idFamiliaCell.v !== lastFamilyId)) {
                lastFamilyId = idFamiliaCell.v;
                currentFamilyColor = (currentFamilyColor + 1) % 2;
            }

            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = XLSX.utils.encode_cell({ r: R, c: C });
                if (!worksheet[cell]) continue;

                const isPersonField = C < 10;
                const bgColor = isPersonField
                    ? familyColors[currentFamilyColor].person
                    : familyColors[currentFamilyColor].family;

                worksheet[cell].s = {
                    font: { color: { rgb: "000000" } },
                    fill: {
                        patternType: 'solid',
                        fgColor: { rgb: bgColor }
                    },
                    alignment: {
                        horizontal: 'left',
                        vertical: 'center',
                        wrapText: true
                    },
                    border: {
                        top: { style: 'thin', color: { rgb: "CCCCCC" } },
                        bottom: { style: 'thin', color: { rgb: "CCCCCC" } },
                        left: { style: 'thin', color: { rgb: "CCCCCC" } },
                        right: { style: 'thin', color: { rgb: "CCCCCC" } }
                    }
                };
            }
        }
    }

    private addPersonsWorksheet(workbook: XLSX.WorkBook, families: Family[], persons: Person[]): void {
        // Crear un mapa de familias por ID para consulta rápida
        const familiesMap: { [id: number]: Family } = {};
        families.forEach(family => {
            familiesMap[family.id] = family;
        });

        const personsData = persons.map((person, index) => {
            const family = person.familyIdFamily !== undefined ? familiesMap[person.familyIdFamily] : undefined;

            return {
                'Apellido Familiar': family ? family.lastName : 'Sin familia',
                'ID Familia': person.familyIdFamily || 'N/A',
                'N° Integrante': index + 1,
                'Nombre': person.name,
                'Apellido': person.surname,
                'Edad': person.age,
                'Fecha de Nacimiento': person.birthdate,
                'Tipo de Documento': person.typeDocument,
                'Número de Documento': person.documentNumber,
                'Parentesco': person.typeKinship,
                'Patrocinado': person.sponsored,
                'Estado': person.state
            };
        });

        const personWorksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(personsData);

        const personsWsCols = [
            { wch: 20 },
            { wch: 12 },
            { wch: 15 },
            { wch: 20 },
            { wch: 20 },
            { wch: 10 },
            { wch: 18 },
            { wch: 20 },
            { wch: 20 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
        ];
        personWorksheet['!cols'] = personsWsCols;

        this.applyPersonsWorksheetStyles(personWorksheet);

        XLSX.utils.book_append_sheet(workbook, personWorksheet, 'Lista de Beneficiarios');
    }

    private applyPersonsWorksheetStyles(worksheet: XLSX.WorkSheet): void {
        if (!worksheet['!ref']) return;

        const range = XLSX.utils.decode_range(worksheet['!ref']);

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!worksheet[headerCell]) continue;

            worksheet[headerCell].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: {
                    patternType: 'solid',
                    fgColor: { rgb: "107C41" } // Verde más vibrante
                },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                border: {
                    top: { style: 'medium', color: { rgb: "000000" } },
                    bottom: { style: 'medium', color: { rgb: "000000" } },
                    left: { style: 'medium', color: { rgb: "000000" } },
                    right: { style: 'medium', color: { rgb: "000000" } }
                }
            };
        }

        let lastApellido = '';
        let currentColor = 0;
        const colors = ['E2EFDA', 'FFFFFF']; // Verde claro y blanco

        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const apellidoCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 0 })];

            if (apellidoCell && apellidoCell.v !== lastApellido) {
                lastApellido = apellidoCell.v;
                currentColor = (currentColor + 1) % 2;
            }

            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = XLSX.utils.encode_cell({ r: R, c: C });
                if (!worksheet[cell]) continue;

                worksheet[cell].s = {
                    font: { color: { rgb: "000000" } },
                    fill: {
                        patternType: 'solid',
                        fgColor: { rgb: colors[currentColor] }
                    },
                    alignment: {
                        horizontal: C === 0 ? 'left' : 'center',
                        vertical: 'center',
                        wrapText: true
                    },
                    border: {
                        top: { style: 'thin', color: { rgb: "CCCCCC" } },
                        bottom: { style: 'thin', color: { rgb: "CCCCCC" } },
                        left: { style: 'thin', color: { rgb: "CCCCCC" } },
                        right: { style: 'thin', color: { rgb: "CCCCCC" } }
                    }
                };
            }
        }
    }
}
