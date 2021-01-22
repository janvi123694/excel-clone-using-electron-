const { fchmod } = require('fs');
const $ = require('jquery');


$('document').ready(function(){
    let db;   // db to retain the values 
    let lsc; // last selected cell



     // compute teh Addr when a cell is clicked. display the addr in the input bar1.  display the formula( if any ) in input bar2 
    $('.cell').on('click' , function(){
        let rowId = Number($(this).attr('rid')) + 1; //addr eg: a2 b5. 100rows 26col. cellAddr-> coldId+ rowId.  
        let colId = Number($(this).attr('cid'));   // rowId-> add 1  colId-> convert Number to Char 
        let cellAddr = String.fromCharCode(65+colId) + rowId;
        
        console.log(cellAddr)
        $('#address').val(cellAddr); // display the cell addr in input bar1 
        let cellObj = db[rowId][colId];
        $('#formula').val(cellObj.formula); // diplay the formula in input bar2
    })


     // On entering the formula 
    $('#formula').on('blur', function(){

        let formula = $(this).val(); // val of the ip entered.  [ must compute using the formula and op in B1]

        let address = $('#address').val();    // address -> target cell. eg B1.  input bar1 stil holds the addr of the last cell  
        let {rowId , colId} = getRowIdColId(address);  // B1-> 1 0 
        let cellObj = db[rowId][colId];   // access the empty obj

        console.log(formula)
        if(cellObj.formula != formula){             // prev val of cell may have been a 1. val 2. formula 
            removeFormula(cellObj);               // if it was formula based earlier(A1+A2) n formula has been updated now eg A1+10. delete all teh info related to f1
            let value = solveFormula(formula , cellObj);   // 1. compute   eg A1 +A2

            cellObj.value = value;      // 2. update db
            cellObj.formula = formula; 
            console.log("value "+value); 

            $(lsc).text(value);  // 3.update ui

            updateChildren(cellObj);  // since the cell has transition from being a value to formula based, its children need to be updated
        }
        
    })
    


    function solveFormula(formula, cellObject){ // ( A1 + A2 )   A1 -> 1. get the indices 2. get the corresponding cell obj 3. get the value 
       // cellObject denotes the OP cell
      let fComponents = formula.split(" "); // ["(", "A1", "+" ,"A2",")"]

      for(let i =0; i<fComponents.length; i++){
         let fComp = fComponents[i];  // A1
         let cellName = fComp[0];  // get the 1st char.  A ie colId


         if(cellName>= 'A' && cellName<='Z'){

            let { rowId , colId } = getRowIdColId(fComp);//fcomp -> A1
            let parentCellObject = db[rowId][colId]; // 1.parentObj is obtained from the formula { name : "A1" , value :10 , formula : "" , children : [] , parents: [] }

             if(cellObject){   

                // add urself in the children arr belonging to parent obj 
                 addSelfToParentsChildren(cellObject , parentCellObject)   // {target/ op obj b1} {parent obj a1}


                //update the parent array in ur obj
                updateParentsOfSelfCellObj(cellObject , fComp)// ({ B1 obj } , "A1")
            }
            
            let value = parentCellObject.value;  // A1 val-> 10 A2 val -> 20 
           formula = formula.replace(fComp , value); //  replace the variables with values in the formula (A1+A2)->(10 + A2)-> ( 10 + 20 )
         }

      }   

      let value = eval(formula); // eval -> inbuilt func.  Can also perform  infix eval
      return value;
    }
    



     // B1 will be added in parent ob's children array
    function addSelfToParentsChildren(cellObject , parentCellObject){
       parentCellObject.children.push(cellObject.name);   // getting teh name [ STring ] from the obj.children of A1 -> [ "B1"]
    }

    //B1'll add in A1 A2 in its parents array
    function updateParentsOfSelfCellObj(cellObject , fComp){
        cellObject.parents.push(fComp);  // fcomp is a string already 
    }

     // when u enter a value in a cell 
    $('.cell').on('blur', function(){   // blur -> mouseLeave event. when the focus shifts away from the cell, blur event gets triggered
        
        lsc = this;
        console.log(this); //OP -> <div class="cell" contenteditable="true" rid="0" cid="5">300</div>
        let value = $(this).text(); // getValue eg 100   text(), for div. val() for input 
        
        let rowId = Number($(this).attr('rid')); 
        let colId = Number($(this).attr('cid'));  
        let cellObject = db[rowId][colId]; 

        if(cellObject.value != value){   // update only when the value changes 

            //  suppose the db consists of A1 = 10 A2 = 20 B1 = (A1+A2) //20. 

            //  Now I'd like to change the value of A1. -> Subsequently B1 must be updated too since A1 is the parent of B1
    
            //  Update db
            cellObject.value = value;// the new value may have been 1.value 2.formula based. if val-> wont have parents just update children else

            if(cellObject.formula){   // FORMULA BASED if the cell in which uve entered a val was formula based before
                $('#formula').val("");
                removeFormula(cellObject)
            }
            updateChildren(cellObject);    // cellObject refers to A1 
            console.log(cellObject);

             // update UI  (accessing el by a cell's attr ie rid cid)
            $(`.cell[rid = ${rowId} ][cid = ${colId}]`).text(value); 
        }
        
     })


    function removeFormula(cellObject){
        // 1.i already updated value 

        //2. set formula to null
        cellObject.formula =""; 
        
        //3. remove urself from parents 's children arr
        for(let i =0;i<cellObject.parents.length ; i++){
            let parentName = cellObject.parents[i]; 
            let { rowId , colId } = getRowIdColId(parentName);
            let parentCellObject = db[rowId][colId]; 
            
            let filteredChildren = parentCellObject.children.filter( function(child){ // every child is teh el belonging to children arr eg A1 B1 C1
                return child != cellObject.name
            })
            parentCellObject.children = filteredChildren;
        }

        //4. cellobj.parents will point to an empty arr
        cellObject.parents=[]; 
    }


    function updateChildren(cellObject){  // cellObj refers to A1
       /* 
        current cellObject
       {
           name : "A1",
           val : 10,   
           formula :"", 
           children : {B1},
           parents :[]
       }

       all its children's parrent arrays must be updated
       */                                                  //DFS
      for(let i =0;i<cellObject.children.length;i++){   // A1 asks B1 to update itself , B1 asks its children C1, C2 to update themselves, C1,C2 ask their children to
        
        // obtain the child's addr("B1") and find its indexes
          let child = cellObject.children[i]; // "B1"    
          let { rowId , colId } = getRowIdColId(child); // get indexes of child addr B1 -> 1 0 

          let childrenCellObjet = db [rowId] [colId]; 

          // 1.RECOMPUTE B1 since A1 has been modified 2.2nd para wud be passed as undefined therefore children and parent arr wont be updated.
          let value = solveFormula(childrenCellObjet.formula) 

          childrenCellObjet.value = value;    // update value in db
          console.log("new value2 "+value)

          $(`.cell[rid = ${rowId} ][cid = ${colId}]`).text(value); 

          updateChildren(childrenCellObjet);      // applying dfs 

      }
    }

    function getRowIdColId(address){  // address eg A2 r owId colId 0 1 
      let colId = address.charCodeAt(0) - 65; 
      let rowId = Number(address.substring(1)) - 1; // z100   d2 -> 3 1  d-> 3. 2->1
      return { rowId :rowId,
                colId : colId
             }; 
    }



    function init(){ // size of db -> 26*100
        db = []; 
        for(let i =0;i<100;i++){
            let row=[];
            for(let j =0;j<26;j++){
                let cellAddress = String.fromCharCode(65+j) + (i+1);
                let cellObject = {
                    name: cellAddress,
                    value : "",
                    formula : "",
                    parents : [],
                    children : []
                }
                row.push(cellObject); // [ {...}, {...},{...}] 26 cellObj in each row
            }
            db.push(row);      // db contains 100 rows
        }
        console.log(db) 
    }
      
    init(); 
})

