function setPropertyRequired(attributeName, boolValue = true) {
  //обов"язкове
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.required = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function setPropertyHidden(attributeName, boolValue = true) {
  //приховане
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.hidden = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function setPropertyDisabled(attributeName, boolValue = true) {
  //недоступне
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.disabled = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function setAttrValue(attributeCode, attributeValue) {
  var attribute = EdocsApi.getAttributeValue(attributeCode);
  attribute.value = attributeValue;
  EdocsApi.setAttributeValue(attribute);
}

//Скрипт 1. Автоматичне визначення email ініціатора рахунку та підрозділу
function onCreate() {
  EdocsApi.setAttributeValue({
    code: "OrgRPEmail",
    value: EdocsApi.getEmployeeDataByEmployeeID(CurrentDocument.initiatorId).email,
    text: null,
  });
  EdocsApi.setAttributeValue({
    code: "Branch",
    value: EdocsApi.getOrgUnitDataByUnitID(EdocsApi.getEmployeeDataByEmployeeID(CurrentDocument.initiatorId).unitId, 1).unitId,
    text: null,
  });
  setAttrValue("Signatory2", CurrentDocument.initiatorId);
}

function onChangeDocInitiator() {
  debugger;
  var initiator = EdocsApi.getAttributeValue("DocInitiator");
  var Signatory1 = EdocsApi.getAttributeValue("Signatory1");
  if (initiator && initiator.value) {
    var manager = EdocsApi.getEmployeeManagerByEmployeeID(initiator.value);
    if (manager) {
      Signatory1.value = manager.managerId;
      Signatory1.text = manager.shortName;
    } else {
      var unitLevel = EdocsApi.getEmployeeDataByEmployeeID(initiator.value).unitLevel;
      for (let index = unitLevel; index > 0; index--) {
        var item = EdocsApi.getEmployeeManagerByEmployeeID(initiator.value, index);
        if (item) {
          Signatory1.value = item.employeeId;
          Signatory1.text = item.shortName;
        }
      }
    }
  }
  EdocsApi.setAttributeValue(Signatory1);
  setAttrValue("Signatory2", initiator.value);
}

// function onChangeDocInitiator() {
//   if (EdocsApi.getAttributeValue("DocInitiator").value) {
//     setAttrValue(
//       "Signatory2",
//       EdocsApi.getAttributeValue("DocInitiator").value
//     );
//   } else {
//     setAttrValue("Signatory2", "");
//   }
// }

function onBeforeCardSave() {
  setSections();
}

function onSearchBranch(searchRequest) {
  searchRequest.filterCollection.push({
    attributeCode: "SubdivisionLevelDirect",
    value: "1",
  });
}

//Скрипт 2. Вирахування ПДВ
function onChangeContract() {
  debugger;
  var VATpercentage = 0;
  var attrVATAmount = EdocsApi.getAttributeValue("ContractVATAmount");
  var attrVATpercentage = EdocsApi.getAttributeValue("ContractVATPercent");
  var attrContractAmount = EdocsApi.getAttributeValue("ContractAmount");
  var attrAmountOutVAT = EdocsApi.getAttributeValue("ContractOutVAT");

  switch (attrVATpercentage.value) {
    case "20%": // if (x === 'если сумма НДС=20%')
      var VATpercentage = 1.2;
      break;

    case "7%": // if (x === 'если сумма НДС=7%')
      var VATpercentage = 1.07;
      break;
  }

  if (attrVATpercentage.value === null || attrContractAmount.value === null) {
    // если нет ставки НДС и суммы, то укажем ноль в сумме НДС и без НДС
    attrVATAmount.value = 0;
    attrAmountOutVAT.value = 0;
  } else if (VATpercentage == 0) {
    attrVATAmount.value = 0;
    attrAmountOutVAT.value = attrContractAmount.value;
  } else {
    attrAmountOutVAT.value = (attrContractAmount.value / VATpercentage).toFixed(2);
    attrVATAmount.value = (attrContractAmount.value - attrAmountOutVAT.value).toFixed(2);
  }

  EdocsApi.setAttributeValue(attrVATAmount);
  EdocsApi.setAttributeValue(attrAmountOutVAT);
}

function onChangeContractVATPercent() {
  onChangeContract();
}

//Скрипт 3. Заповнення значення поля суми договору прописом
function onChangeContractAmount() {
  setAmountDescription();
  onChangeContract();
}

function setAmountDescription() {
  debugger;
  var ContractAmount = EdocsApi.getAttributeValue("ContractAmount").value;

  if (ContractAmount) {
    setAttrValue("VATAmmountDescription", EdocsApi.numberToCurrency(ContractAmount, "uk", "UAH"));
  } else {
    setAttrValue("VATAmmountDescription", "");
  }
}

//Скрипт 4. Заповнення інформації про додаткового підписанта
function setAdditionalSignatory() {
  debugger;

  const attrOrgAgentSurname2 = EdocsApi.getAttributeValue("OrgAgentSurname2");
  if (attrOrgAgentSurname2.value) {
    const OrganizationId = EdocsApi.getAttributeValue("OrganizationId").value;
    if (OrganizationId) {
      const data = EdocsApi.getContractorData(OrganizationId);
      if (data) {
        if (data.authorisedPersons.find((x) => x.fullName.replace(",", ".") == EdocsApi.getAttributeValue("OrgAgentSurname2").text)) {
          setAttrValue("OrgAgent2", data.authorisedPersons.find((x) => x.fullName.replace(",", ".") == EdocsApi.getAttributeValue("OrgAgentSurname2").text)?.nameGenitive);
          setAttrValue("OrgAgentPosition2", data.authorisedPersons.find((x) => x.fullName == EdocsApi.getAttributeValue("OrgAgentSurname2").text)?.positionGenitive);
          setAttrValue("PositionOrgAgent2", data.authorisedPersons.find((x) => x.fullName == EdocsApi.getAttributeValue("OrgAgentSurname2").text)?.position);
          setAttrValue("ActsOnBasisOrg2", data.authorisedPersons.find((x) => x.fullName == EdocsApi.getAttributeValue("OrgAgentSurname2").text)?.actingUnderThe);
          setAttrValue("InitialAgent2", formattingOfInitials(attrOrgAgentSurname2.text));
        } else {
          EdocsApi.message("Введіть коректного підписанта!");
          setAttrValue("OrgAgent2", "");
          setAttrValue("OrgAgentPosition2", "");
          setAttrValue("PositionOrgAgent2", "");
          setAttrValue("ActsOnBasisOrg2", "");
          setAttrValue("InitialAgent2", "");
        }
      }
    }
  }
}

function onChangeOrgAgentSurname1() {
  debugger;
  var attrOrgAgentSurname1 = EdocsApi.getAttributeValue("OrgAgentSurname1");
  if (attrOrgAgentSurname1.text) setAttrValue("InitialAgent1", formattingOfInitials(attrOrgAgentSurname1.text));
  if (attrOrgAgentSurname1.value) setAttrValue("InitialAgent1", formattingOfInitials(attrOrgAgentSurname1.value));
}

function onChangeOrgAgentSurname2() {
  setAdditionalSignatory();
  var attrOrgAgentSurname2 = EdocsApi.getAttributeValue("OrgAgentSurname2").text;
  if (attrOrgAgentSurname2) setAttrValue("InitialAgent2", formattingOfInitials(attrOrgAgentSurname2));
}

function formattingOfInitials(fullName) {
  debugger;
  var arr = fullName.split(" ");
  var arrNew = [];
  arr[1] && arrNew.push(arr[1]?.slice(0, 1).toUpperCase() + arr[1]?.slice(1).toLowerCase());
  arrNew.push(arr[0].toUpperCase());
  return arrNew.join(" ");
}
//Заповнення ініціалів підписантів Замовника
function onChangeAgentSurnameContractor() {
  debugger;
  var AgentSurnameContractor = EdocsApi.getAttributeValue("AgentSurnameContractor").value;
  if (AgentSurnameContractor) {
    setAttrValue("ContractAgentSurname", formattingOfInitials(AgentSurnameContractor));
  } else {
    setAttrValue("ContractAgentSurname", "");
  }
}

// Скрипт 6. Визначення ролі за розрізом
function setSections() {
  debugger;
  var Branch = EdocsApi.getAttributeValue("Branch");
  if (Branch.value) {
    var Sections = EdocsApi.getAttributeValue("Sections");
    var BranchData = EdocsApi.getOrgUnitDataByUnitID(Branch.value);
    if (Sections.value != BranchData.unitName) {
      Sections.value = BranchData.unitName;
      EdocsApi.setAttributeValue(Sections);
    }
  }
}

function onChangeBranch() {
  setSections();
}

//Скрипт 7. Зміна властивостей атрибутів
function SignPaperContractTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("SignPaperContract")?.state;
  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated") {
    setPropertyRequired("RegDate");
    setPropertyRequired("RegNumber");
    setPropertyHidden("RegDate", false);
    setPropertyHidden("RegNumber", false);
    setPropertyDisabled("RegDate", false);
    setPropertyDisabled("RegNumber", false);
  } else if (stateTask == "completed") {
    setPropertyRequired("RegDate");
    setPropertyRequired("RegNumber");
    setPropertyHidden("RegDate", false);
    setPropertyHidden("RegNumber", false);
    setPropertyDisabled("RegDate");
    setPropertyDisabled("RegNumber");
  } else {
    setPropertyRequired("RegDate", false);
    setPropertyRequired("RegNumber", false);
    setPropertyHidden("RegDate");
    setPropertyHidden("RegNumber");
    setPropertyDisabled("RegDate", false);
    setPropertyDisabled("RegNumber", false);
  }
}

function RegisterContractTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("RegisterContract" + EdocsApi.getAttributeValue("Sections").value)?.state;
  if (EdocsApi.getCaseTaskDataByCode("RegisterContract" + EdocsApi.getAttributeValue("Sections").value) && !EdocsApi.getCaseTaskDataByCode("RegisterContract" + EdocsApi.getAttributeValue("Sections").value).notIncludeInRoute) {
    if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated") {
      setPropertyRequired("RegDate");
      setPropertyRequired("RegNumber");
      setPropertyHidden("RegDate", false);
      setPropertyHidden("RegNumber", false);
      setPropertyDisabled("RegDate", false);
      setPropertyDisabled("RegNumber", false);
    } else if (stateTask == "completed") {
      setPropertyRequired("RegDate");
      setPropertyRequired("RegNumber");
      setPropertyHidden("RegDate", false);
      setPropertyHidden("RegNumber", false);
      setPropertyDisabled("RegDate");
      setPropertyDisabled("RegNumber");
    } else {
      setPropertyRequired("RegDate", false);
      setPropertyRequired("RegNumber", false);
      setPropertyHidden("RegDate");
      setPropertyHidden("RegNumber");
      setPropertyDisabled("RegDate", false);
      setPropertyDisabled("RegNumber", false);
    }
  }
}

function onCardInitialize() {
  SignPaperContractTask();
  RegisterContractTask();
}

function onTaskExecuteSignPaperContract(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("RegDate").value || !EdocsApi.getAttributeValue("RegNumber").value) throw "Внесіть номер та дату реєстрації договору";
  }
}

function onTaskExecuteRegisterContract(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("RegDate").value || !EdocsApi.getAttributeValue("RegNumber").value) throw "Внесіть номер та дату реєстрації договору";
    sendComment();
  }
}

//Скрипт 8. Інформування замовника про дату та номер реєстрації договору
function sendComment(routeStage) {
  debugger;
  var orgCode = EdocsApi.getAttributeValue("OrgCode").value;
  var orgShortName = EdocsApi.getAttributeValue("OrgShortName").value;
  if (!orgCode || !orgShortName) {
    return;
  }
  var comment = `${EdocsApi.getAttributeValue("DocKind").text} зареєстровано за № ${EdocsApi.getAttributeValue("RegNumber").value} від ${moment(new Date(EdocsApi.getAttributeValue("RegDate").value)).format("DD.MM.YYYY")}`;
  var methodData = {
    extSysDocId: CurrentDocument.id,
    ExtSysDocVersion: CurrentDocument.version,
    eventType: "CommentAdded",
    comment: comment,
    partyCode: orgCode,
    userTitle: CurrentUser.name,
    partyName: orgShortName,
    occuredAt: new Date(),
  };
  EdocsApi.runExternalFunction("ESIGN1", "integration/processEvent", methodData);
}

//Скрипт 9. Передача договору на підписання в зовнішню систему
function setDataForESIGN() {
  debugger;
  var caseType = EdocsApi.getAttributeValue("DocType").value;
  var caseKind = EdocsApi.getAttributeValue("DocKind").text;
  var name = "";
  if (caseKind) {
    name += caseKind;
  } else {
    name += caseType;
  }
  name += `№ ${CurrentDocument.id}`;

  doc = {
    DocName: name,
    extSysDocId: CurrentDocument.id,
    extSysDocVersion: CurrentDocument.version,
    docType: "ContractCommission",
    File: "",
    parties: [
      {
        taskType: "ToSign",
        taskState: "Done",
        legalEntityCode: EdocsApi.getAttributeValue("OrgCode").value,
        contactPersonEmail: EdocsApi.getAttributeValue("OrgRPEmail").value,
        signatures: [],
      },
      {
        taskType: "ToSign",
        taskState: "NotAssigned",
        legalEntityCode: EdocsApi.getAttributeValue("ContractorCode").value,
        contactPersonEmail: EdocsApi.getAttributeValue("ContractorRPEmail").value,
        expectedSignatures: [],
      },
    ],
    additionalAttributes: [],
    sendingSettings: {
      attachFiles: "fixed", //, можна також встановлювати 'firstOnly' - Лише файл із першої зафіксованої вкладки(Головний файл), або 'all' - всі файли, 'fixed' - усі зафіксовані
      attachSignatures: "signatureAndStamp", // -'signatureAndStamp'Типи “Підпис” або “Печатка”, можна також встановити 'all' - усі типи цифрових підписів
    },
  };
  EdocsApi.setAttributeValue({ code: "JSON", value: JSON.stringify(doc) });
}

function onTaskExecuteSendOutDoc(routeStage) {
  debugger;
  if (routeStage.executionResult == "rejected") {
    return;
  }
  setDataForESIGN();
  var idnumber = EdocsApi.getAttributeValue("DocId");
  var methodData = {
    ExtSysDocVersion: CurrentDocument.version,
    extSysDocId: idnumber.value,
  };

  routeStage.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/importDoc", // метод зовнішньої системи
    data: methodData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: true, // виконувати завдання асинхронно
  };
}
function onTaskCommentedSendOutDoc(caseTaskComment) {
  debugger;
  var orgCode = EdocsApi.getAttributeValue("OrgCode").value;
  var orgShortName = EdocsApi.getAttributeValue("OrgShortName").value;
  if (!orgCode || !orgShortName) {
    return;
  }
  var idnumber = EdocsApi.getAttributeValue("DocId");
  var methodData = {
    extSysDocId: idnumber.value,
    ExtSysDocVersion: CurrentDocument.version,
    eventType: "CommentAdded",
    comment: caseTaskComment.comment,
    partyCode: orgCode,
    userTitle: CurrentUser.name,
    partyName: orgShortName,
    occuredAt: new Date(),
  };

  caseTaskComment.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/processEvent", // метод зовнішньої системи
    data: methodData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: true, // виконувати завдання асинхронно
  };
}
