import tape from '@aureooms/js-stream' ;
import shaketape from './shaketape' ;

export default async function shakestring ( string , outputStream ) {

  const inputCharacterTape = tape.fromString( string ) ;

  await shaketape( inputCharacterTape , outputStream ) ;

}
