import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Family } from '../interfaces/familiaDto';
import { Person } from '../interfaces/person';

@Injectable({
    providedIn: 'root'
})
export class FamilyPdfService {

    private readonly SPACING_SMALL = 10;
    private readonly SPACING_MEDIUM = 15;
    private readonly PAGE_MARGIN_BOTTOM = 15;

    generateFamilyReports(families: Family[], persons: Person[]): void {
        const familyPersonsMap: { [familyId: number]: Person[] } = {};

        persons.forEach(person => {
            if (person.familyIdFamily !== undefined) {
                if (!familyPersonsMap[person.familyIdFamily]) {
                    familyPersonsMap[person.familyIdFamily] = [];
                }
                familyPersonsMap[person.familyIdFamily].push(person);
            }
        });

        families.forEach(family => {
            const familyMembers = familyPersonsMap[family.id] || [];
            this.createFamilyPdf(family, familyMembers);
        });
    }

    generateConsolidatedReport(families: Family[], persons: Person[]): void {
        const familyPersonsMap: { [familyId: number]: Person[] } = {};

        persons.forEach(person => {
            if (person.familyIdFamily !== undefined) {
                if (!familyPersonsMap[person.familyIdFamily]) {
                    familyPersonsMap[person.familyIdFamily] = [];
                }
                familyPersonsMap[person.familyIdFamily].push(person);
            }
        });

        const groupedFamilies: { [key: string]: Family[] } = {};
        families.forEach(family => {
            const lastName = family.lastName.trim();
            if (!groupedFamilies[lastName]) {
                groupedFamilies[lastName] = [];
            }
            groupedFamilies[lastName].push(family);
        });

        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;

        doc.setFontSize(22);
        doc.setTextColor(43, 87, 151); // #2B5797
        doc.text('INFORME DE REGISTRO FAMILIAR', doc.internal.pageSize.width / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - 20, 30, { align: 'right' });

        let isFirstFamily = true;

        Object.keys(groupedFamilies).sort().forEach(lastName => {
            const familiesWithSameLastName = groupedFamilies[lastName];

            familiesWithSameLastName.forEach(family => {
                const familyMembers = familyPersonsMap[family.id] || [];

                if (!isFirstFamily) {
                    doc.addPage();
                } else {
                    isFirstFamily = false;
                }

                doc.setFontSize(16);
                doc.setTextColor(30, 113, 69); // #1E7145
                doc.text(`Familia: ${family.lastName}`, 20, 40); // Agrega dos líneas en blanco (40)
                doc.text('', 20, 45); // Línea en blanco
                doc.text('', 20, 50); // Línea en blanco

                this.addFamilySummary(doc, family, familyMembers);

                const currentY = (doc as any).lastAutoTable.finalY + this.SPACING_MEDIUM;

                if (currentY > pageHeight - this.PAGE_MARGIN_BOTTOM * 3) {
                    doc.addPage();
                    doc.setFontSize(14);
                    doc.setTextColor(51, 51, 51); // #333333
                    doc.text('Miembros de la familia', 20, 20);
                    this.addFamilyMembers(doc, familyMembers, 25);
                } else {
                    doc.setFontSize(14);
                    doc.setTextColor(51, 51, 51); // #333333
                    doc.text('Miembros de la familia', 20, currentY);
                    if (familyMembers.length > 0) {
                        this.addFamilyMembers(doc, familyMembers, currentY + this.SPACING_SMALL);
                    } else {
                        doc.setFontSize(10);
                        doc.setTextColor(0, 0, 0);
                        doc.setFont('helvetica', 'italic');
                        doc.text('Esta familia no tiene miembros registrados.', 20, currentY + this.SPACING_SMALL);
                    }
                }
            });
        });

        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }

        try {
            doc.save('Informe_Consolidado_Familias.pdf');
        } catch (error) {
            console.error('Error al guardar el PDF:', error);
        }
    }

    private createFamilyPdf(family: Family, familyMembers: Person[]): void {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;

        doc.setFontSize(22);
        doc.setTextColor(43, 87, 151); // #2B5797
        doc.text('INFORME FAMILIAR', doc.internal.pageSize.width / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - 20, 30, { align: 'right' });

        doc.setFontSize(18);
        doc.setTextColor(30, 113, 69); // #1E7145
        doc.text(`Familia: ${family.lastName}`, 20, 40);

        this.addFamilySummary(doc, family, familyMembers);

        const currentY = (doc as any).lastAutoTable.finalY + this.SPACING_MEDIUM;

        if (currentY > pageHeight - this.PAGE_MARGIN_BOTTOM * 3) {
            doc.addPage();
            doc.setFontSize(16);
            doc.setTextColor(51, 51, 51); // #333333
            doc.text('Miembros de la familia', 20, 20);
            if (familyMembers.length > 0) {
                this.addFamilyMembers(doc, familyMembers, 25);
            } else {
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'italic');
                doc.text('Esta familia no tiene miembros registrados.', 20, 25);
            }
        } else {
            doc.setFontSize(16);
            doc.setTextColor(51, 51, 51); // #333333
            doc.text('Miembros de la familia', 20, currentY);
            if (familyMembers.length > 0) {
                this.addFamilyMembers(doc, familyMembers, currentY + this.SPACING_SMALL);
            } else {
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'italic');
                doc.text('Esta familia no tiene miembros registrados.', 20, currentY + this.SPACING_SMALL);
            }
        }

        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }

        try {
            doc.save(`Familia_${family.lastName}_${family.id}.pdf`);
        } catch (error) {
            console.error('Error al guardar el PDF:', error);
        }
    }

    private addFamilySummary(doc: jsPDF, family: Family, familyMembers: Person[]): void {
        const summaryData = [
            ['ID', family.id?.toString() || ''],
            ['Apellido', family.lastName || ''],
            ['Dirección', family.direction || ''],
            ['Número de miembros', `${familyMembers.length} (${family.numberMembers} registrados)`],
            ['Número de hijos', family.numberChildren?.toString() || ''],
            ['Tipo de familia', family.familyType || 'No especificado'],
            ['Estado', family.status || 'No especificado'],
            ['Motivo de ingreso', family.reasibAdmission || 'No especificado'],
            ['Frecuencia semanal', family.weeklyFrequency || 'No especificado']
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Característica', 'Detalle']],
            body: summaryData,
            headStyles: {
                fillColor: [81, 51, 171], // #5133AB
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [230, 240, 255] // #E6F0FF
            },
            margin: { left: 20, right: 20 }
        });
    }

    private addFamilyMembers(doc: jsPDF, familyMembers: Person[], startY: number): void {
        const pageHeight = doc.internal.pageSize.height;
        let currentY = startY;

        familyMembers.forEach((person, index) => {

            const estimatedHeight = 75;

            if (currentY + estimatedHeight > pageHeight - this.PAGE_MARGIN_BOTTOM && index > 0) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(43, 87, 151); // #2B5797
            doc.setFont('helvetica', 'bold');
            doc.text(`${person.name} ${person.surname}`, 20, currentY);

            const personData = [
                ['Edad', person.age?.toString() || 'No especificada'],
                ['Fecha de nacimiento', person.birthdate || 'No especificada'],
                ['Parentesco', person.typeKinship || 'No especificado'],
                ['Tipo de documento', person.typeDocument || 'No especificado'],
                ['Número de documento', person.documentNumber || 'No especificado'],
                ['Patrocinado', person.sponsored || 'No']
            ];

            autoTable(doc, {
                startY: currentY + this.SPACING_SMALL / 2,
                head: [['Atributo', 'Valor']],
                body: personData,
                headStyles: {
                    fillColor: [81, 51, 171], // #5133AB
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [230, 240, 255] // #E6F0FF
                },
                margin: { left: 20, right: 20 }
            });

            currentY = (doc as any).lastAutoTable.finalY + this.SPACING_SMALL;
        });
    }

    generateDetailedFamilyReport(family: Family, familyMembers: Person[]): void {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;

        doc.setFontSize(22);
        doc.setTextColor(43, 87, 151); // #2B5797
        doc.text('INFORME FAMILIAR DETALLADO', doc.internal.pageSize.width / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - 20, 30, { align: 'right' });

        doc.setFontSize(18);
        doc.setTextColor(30, 113, 69); // #1E7145
        doc.text(`Familia: ${family.lastName}`, 20, 40);

        doc.setFontSize(16);
        doc.setTextColor(210, 71, 38); // #D24726
        doc.text('Información Básica', 20, 55);

        this.addFamilySummary(doc, family, familyMembers);
        let currentY = (doc as any).lastAutoTable.finalY + this.SPACING_MEDIUM;

        if (currentY + 100 > pageHeight - this.PAGE_MARGIN_BOTTOM) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(210, 71, 38); // #D24726
        doc.text('Información de Vivienda', 20, currentY);

        const housingData = [
            ['Tenencia', family.tenure || 'No especificado'],
            ['Tipo de Vivienda', family.housingDetails.typeOfHousing || 'No especificado'],
            ['Material de Vivienda', family.housingDetails.housingMaterial || 'No especificado'],
            ['Seguridad de Vivienda', family.housingDetails.housingSecurity || 'No especificado'],
            ['Ambiente del Hogar', family.housingDetails.homeEnvironment || 'No especificado'],
            ['Número de Habitaciones', family.housingDetails.numberRooms?.toString() || 'No especificado'],
            ['Número de Dormitorios', family.housingDetails.numberOfBedrooms?.toString() || 'No especificado'],
            ['Habitabilidad', family.housingDetails.habitability || 'No especificado'],
            ['Habitabilidad del Edificio', family.housingDetails.habitabilityBuilding || 'No especificado']
        ];

        autoTable(doc, {
            startY: currentY + this.SPACING_SMALL,
            head: [['Característica', 'Detalle']],
            body: housingData,
            headStyles: {
                fillColor: [81, 51, 171], // #5133AB
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [230, 240, 255] // #E6F0FF
            },
            margin: { left: 20, right: 20 }
        });

        currentY = (doc as any).lastAutoTable.finalY + this.SPACING_MEDIUM;

        if (currentY + 100 > pageHeight - this.PAGE_MARGIN_BOTTOM) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(210, 71, 38); // #D24726
        doc.text('Servicios Básicos', 20, currentY);

        this.addBasicServicesTable(doc, family, currentY + this.SPACING_SMALL);
        currentY = (doc as any).lastAutoTable.finalY + this.SPACING_MEDIUM;

        if (currentY + 100 > pageHeight - this.PAGE_MARGIN_BOTTOM) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(210, 71, 38); // #D24726
        doc.text('Salud Familiar', 20, currentY);

        const healthData = [
            ['Tipo de Alimentación', family.feedingType || 'No especificado'],
            ['Tipo de Seguro', family.safeType || 'No especificado'],
            ['Enfermedad Familiar', family.familyDisease || 'No especificado'],
            ['Tratamiento', family.treatment || 'No especificado'],
            ['Historial de Enfermedad', family.diseaseHistory || 'No especificado'],
            ['Examen Médico', family.medicalExam || 'No especificado']
        ];

        autoTable(doc, {
            startY: currentY + this.SPACING_SMALL,
            head: [['Característica', 'Detalle']],
            body: healthData,
            headStyles: {
                fillColor: [81, 51, 171], // #5133AB
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [230, 240, 255] // #E6F0FF
            },
            margin: { left: 20, right: 20 }
        });

        currentY = (doc as any).lastAutoTable.finalY + this.SPACING_MEDIUM;

        if (currentY + 60 > pageHeight - this.PAGE_MARGIN_BOTTOM) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(210, 71, 38); // #D24726
        doc.text('Situación Social', 20, currentY);

        const socialData = [
            ['Problemas Sociales', family.socialProblems || 'No especificado']
        ];

        autoTable(doc, {
            startY: currentY + this.SPACING_SMALL,
            head: [['Característica', 'Detalle']],
            body: socialData,
            headStyles: {
                fillColor: [81, 51, 171], // #5133AB
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [230, 240, 255] // #E6F0FF
            },
            margin: { left: 20, right: 20 }
        });

        doc.addPage();

        doc.setFontSize(16);
        doc.setTextColor(210, 71, 38); // #D24726
        doc.text('Miembros de la Familia', 20, 20);

        if (familyMembers.length > 0) {
            this.addDetailedFamilyMembers(doc, familyMembers);
        } else {
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'italic');
            doc.text('Esta familia no tiene miembros registrados.', 20, 35);
        }

        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }

        try {
            doc.save(`Informe_Detallado_${family.lastName}_${family.id}.pdf`);
        } catch (error) {
            console.error('Error al guardar el PDF:', error);
        }
    }

    private addBasicServicesTable(doc: jsPDF, family: Family, startY: number): void {
        if (!family.basicService) {
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'italic');
            doc.text('No hay información de servicios básicos registrada.', 20, startY);
            (doc as any).lastAutoTable = { finalY: startY + 10 }; // Simulamos una tabla para mantener la coherencia
            return;
        }

        const servicesData = [
            ['Servicio de Agua', family.basicService.waterService || 'No especificado'],
            ['Servicio de Desagüe', family.basicService.servDrain || 'No especificado'],
            ['Servicio de Luz', family.basicService.servLight || 'No especificado'],
            ['Servicio de Cable', family.basicService.servCable || 'No especificado'],
            ['Servicio de Gas', family.basicService.servGas || 'No especificado'],
            ['Área', family.basicService.area || 'No especificado'],
            ['Referencia de Ubicación', family.basicService.referenceLocation || 'No especificado'],
            ['Residuos', family.basicService.residue || 'No especificado'],
            ['Alumbrado Público', family.basicService.publicLighting || 'No especificado'],
            ['Seguridad', family.basicService.security || 'No especificado'],
            ['Alimentación', family.basicService.feeding || 'No especificado'],
            ['Económico', family.basicService.economic || 'No especificado'],
            ['Espiritual', family.basicService.spiritual || 'No especificado'],
            ['Compañía Social', family.basicService.socialCompany || 'No especificado'],
            ['Guía Cognitiva', family.basicService.guideTip || 'No especificado']
        ];

        autoTable(doc, {
            startY: startY,
            head: [['Servicio', 'Estado']],
            body: servicesData,
            headStyles: {
                fillColor: [81, 51, 171], // #5133AB
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [230, 240, 255] // #E6F0FF
            },
            margin: { left: 20, right: 20 }
        });
    }

    private addDetailedFamilyMembers(doc: jsPDF, familyMembers: Person[]): void {
        const pageHeight = doc.internal.pageSize.height;
        let currentY = 30;

        familyMembers.forEach((person, index) => {
            const estimatedHeight = 100;

            if (currentY + estimatedHeight > pageHeight - this.PAGE_MARGIN_BOTTOM && index > 0) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(43, 87, 151); // #2B5797
            doc.setFont('helvetica', 'bold');
            doc.text(`${person.name} ${person.surname}`, 20, currentY);

            const personData = [
                ['Edad', person.age?.toString() || 'No especificada'],
                ['Fecha de nacimiento', person.birthdate || 'No especificada'],
                ['Tipo de documento', person.typeDocument || 'No especificado'],
                ['Número de documento', person.documentNumber || 'No especificado'],
                ['Parentesco', person.typeKinship || 'No especificado'],
                ['Patrocinado', person.sponsored || 'No'],
                ['Estado', person.state || 'No especificado']
            ];

            autoTable(doc, {
                startY: currentY + this.SPACING_SMALL / 2,
                head: [['Atributo', 'Valor']],
                body: personData,
                headStyles: {
                    fillColor: [81, 51, 171], // #5133AB
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [230, 240, 255] // #E6F0FF
                },
                margin: { left: 20, right: 20 }
            });

            currentY = (doc as any).lastAutoTable.finalY + this.SPACING_MEDIUM;
        });
    }
}
