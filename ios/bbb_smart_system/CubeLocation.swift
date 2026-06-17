import CoreData

@objc(CubeLocation)
public class CubeLocation: NSManagedObject {
  @NSManaged public var clatitude: String?
  @NSManaged public var clongitute: String?
  @NSManaged public var ctimestamp: String?
  @NSManaged public var onlineOrOffline: String?
  @NSManaged public var chorizontalAccuracy: String?
}
